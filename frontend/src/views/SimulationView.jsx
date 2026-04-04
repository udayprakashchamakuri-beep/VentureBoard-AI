import { useEffect, useMemo, useRef } from "react";
import {
  buildAdvisorParagraph,
  buildDirectAdvisorReply,
  buildRoundSummary,
  formatAdvisorStanceLabel,
  formatDecisionLabel,
  shouldShowAdvisorStanceBadge,
  toPlainText,
} from "../plainLanguage";

function getConversationMeta(agentMeta, name) {
  if (agentMeta[name]) {
    return agentMeta[name];
  }

  if (name === "General Assistant") {
    return {
      accent: "#7be7d4",
      symbol: "smart_toy",
      label: "General Assistant",
      title: "Direct model answer",
      boardRole: "Direct model answer",
    };
  }

  return {
    accent: "#9ac9ff",
    symbol: "smart_toy",
    label: String(name || "Assistant").replace(" Agent", ""),
    title: "Direct answer",
    boardRole: "Direct answer",
  };
}

function buildExpandedReasoningText(turn) {
  if (!turn) {
    return "";
  }

  const sections = [];
  const cleanMessage = toPlainText(String(turn.message ?? "").replace(/^\[[^\]]+\]:\s*/, ""));
  const researchPoints = (turn.research_points ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const keyPoints = (turn.key_points ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const assumptions = (turn.assumptions ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const calculations = (turn.calculations ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const memoryReferences = (turn.memory_references ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const references = (turn.references ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const challengedAgents = (turn.challenged_agents ?? []).map((item) => toPlainText(item)).filter(Boolean);

  if (cleanMessage) {
    sections.push(cleanMessage);
  }
  if (researchPoints.length) {
    sections.push(`Research: ${researchPoints.join(" ")}`);
  }
  if (keyPoints.length) {
    sections.push(`What this advisor is pushing for: ${keyPoints.join(" ")}`);
  }
  if (assumptions.length) {
    sections.push(`What could break: ${assumptions.join(" ")}`);
  }
  if (calculations.length) {
    sections.push(`Numbers behind the view: ${calculations.join(" ")}`);
  }
  if (memoryReferences.length) {
    sections.push(`Relevant past context: ${memoryReferences.join(" ")}`);
  }
  if (references.length || challengedAgents.length) {
    const referenceLine = references.length ? `Cross-checking: ${references.join(", ")}.` : "";
    const challengeLine = challengedAgents.length ? `Pressuring: ${challengedAgents.join(", ")}.` : "";
    sections.push([referenceLine, challengeLine].filter(Boolean).join(" "));
  }

  return sections.join("\n\n");
}

function formatMetricValue(value, formatter = (input) => input) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return formatter(value);
}

function getTurnMetrics(turn) {
  const metrics = turn?.estimated_metrics ?? {};
  const metricItems = [
    {
      label: "Payback",
      value: formatMetricValue(metrics.estimated_payback_months, (input) => `${Math.round(Number(input))} mo`),
    },
    {
      label: "Runway",
      value: formatMetricValue(metrics.runway_months, (input) => `${Math.round(Number(input))} mo`),
    },
    {
      label: "Price",
      value: formatMetricValue(metrics.price_point, (input) => {
        const numeric = Number(input);
        if (!Number.isFinite(numeric) || numeric <= 0) {
          return "";
        }
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(numeric);
      }),
    },
    {
      label: "Margin",
      value: formatMetricValue(metrics.gross_margin_pct, (input) => `${Math.round(Number(input))}%`),
    },
    {
      label: "Launch Budget",
      value: formatMetricValue(metrics.launch_budget, (input) => {
        const numeric = Number(input);
        if (!Number.isFinite(numeric) || numeric <= 0) {
          return "";
        }
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(numeric);
      }),
    },
  ];

  return metricItems.filter((item) => item.value).slice(0, 3);
}

function clampValue(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function buildAgentGraph(turn) {
  const metrics = turn?.estimated_metrics ?? {};
  const snapshot = turn?.score_snapshot ?? {};
  const name = turn?.agent_name ?? "";

  const currencyLabel = (input) => {
    const numeric = Number(input);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return "";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
      notation: numeric >= 100000 ? "compact" : "standard",
    }).format(numeric);
  };

  const graphMap = {
    "CEO Agent": {
      title: "Decision Balance",
      items: [
        { label: "Confidence", value: clampValue(Number(turn?.confidence ?? 0)), display: `${turn?.confidence ?? 0}%` },
        { label: "Growth", value: clampValue(Number(snapshot.growth_potential ?? 0)), display: `${Math.round(Number(snapshot.growth_potential ?? 0))}` },
        { label: "Finance", value: clampValue(Number(snapshot.financial_viability ?? 0)), display: `${Math.round(Number(snapshot.financial_viability ?? 0))}` },
      ],
    },
    "Startup Builder Agent": {
      title: "Launch Readiness",
      items: [
        { label: "Build Speed", value: clampValue(100 - Number(snapshot.operational_complexity ?? 40)), display: `${Math.round(100 - Number(snapshot.operational_complexity ?? 40))}` },
        { label: "Demand Pull", value: clampValue(Number(snapshot.growth_potential ?? 0)), display: `${Math.round(Number(snapshot.growth_potential ?? 0))}` },
        { label: "Execution", value: clampValue(Number(snapshot.market_attractiveness ?? 0)), display: `${Math.round(Number(snapshot.market_attractiveness ?? 0))}` },
      ],
    },
    "Market Research Agent": {
      title: "Market Signal",
      items: [
        { label: "Demand", value: clampValue(Number(snapshot.market_attractiveness ?? 0)), display: `${Math.round(Number(snapshot.market_attractiveness ?? 0))}` },
        { label: "Growth", value: clampValue(Number(snapshot.growth_potential ?? 0)), display: `${Math.round(Number(snapshot.growth_potential ?? 0))}` },
        { label: "Friction", value: clampValue(100 - Number(snapshot.sales_friction ?? 40)), display: `${Math.round(100 - Number(snapshot.sales_friction ?? 40))}` },
      ],
    },
    "Finance Agent": {
      title: "Finance Check",
      items: [
        { label: "Runway", value: clampValue((Number(metrics.runway_months ?? 0) / 18) * 100), display: `${Math.round(Number(metrics.runway_months ?? 0))} mo` },
        { label: "Margin", value: clampValue(Number(metrics.gross_margin_pct ?? 0)), display: `${Math.round(Number(metrics.gross_margin_pct ?? 0))}%` },
        { label: "Payback", value: clampValue(100 - (Number(metrics.estimated_payback_months ?? 0) / 18) * 100), display: `${Math.round(Number(metrics.estimated_payback_months ?? 0))} mo` },
      ],
    },
    "Marketing Agent": {
      title: "Marketing Pulse",
      items: [
        { label: "Demand", value: clampValue(Number(snapshot.market_attractiveness ?? 0)), display: `${Math.round(Number(snapshot.market_attractiveness ?? 0))}` },
        { label: "Differentiation", value: clampValue(100 - Number(snapshot.differentiation_pressure ?? 40)), display: `${Math.round(100 - Number(snapshot.differentiation_pressure ?? 40))}` },
        { label: "Win Rate", value: clampValue(Number(metrics.expected_win_rate_pct ?? 0)), display: `${Math.round(Number(metrics.expected_win_rate_pct ?? 0))}%` },
      ],
    },
    "Pricing Agent": {
      title: "Pricing Model",
      items: [
        { label: "Price", value: clampValue((Number(metrics.price_point ?? 0) / 50000) * 100), display: currencyLabel(metrics.price_point) || "n/a" },
        { label: "Margin", value: clampValue(Number(metrics.gross_margin_pct ?? 0)), display: `${Math.round(Number(metrics.gross_margin_pct ?? 0))}%` },
        { label: "Power", value: clampValue(Number(snapshot.pricing_power ?? 0)), display: `${Math.round(Number(snapshot.pricing_power ?? 0))}` },
      ],
    },
    "Supply Chain Agent": {
      title: "Operations Load",
      items: [
        { label: "Capacity", value: clampValue(100 - Number(snapshot.operational_complexity ?? 40)), display: `${Math.round(100 - Number(snapshot.operational_complexity ?? 40))}` },
        { label: "Stress", value: clampValue(Number(metrics.fulfillment_stress_pct ?? 0)), display: `${Math.round(Number(metrics.fulfillment_stress_pct ?? 0))}%` },
        { label: "Team Load", value: clampValue(100 - Number(snapshot.talent_load ?? 40)), display: `${Math.round(100 - Number(snapshot.talent_load ?? 40))}` },
      ],
    },
    "Hiring Agent": {
      title: "Hiring Pressure",
      items: [
        { label: "Talent Load", value: clampValue(Number(snapshot.talent_load ?? 0)), display: `${Math.round(Number(snapshot.talent_load ?? 0))}` },
        { label: "Core Hires", value: clampValue((Number(metrics.critical_hires_required ?? 0) / 5) * 100), display: `${Math.round(Number(metrics.critical_hires_required ?? 0))}` },
        { label: "Readiness", value: clampValue(100 - Number(snapshot.operational_complexity ?? 40)), display: `${Math.round(100 - Number(snapshot.operational_complexity ?? 40))}` },
      ],
    },
    "Risk Agent": {
      title: "Risk Surface",
      items: [
        { label: "Compliance", value: clampValue(Number(snapshot.compliance_risk ?? 0)), display: `${Math.round(Number(snapshot.compliance_risk ?? 0))}` },
        { label: "Penalty", value: clampValue(Number(metrics.risk_penalty_pct ?? 0)), display: `${Math.round(Number(metrics.risk_penalty_pct ?? 0))}%` },
        { label: "Ops Risk", value: clampValue(Number(snapshot.operational_complexity ?? 0)), display: `${Math.round(Number(snapshot.operational_complexity ?? 0))}` },
      ],
    },
    "Sales Strategy Agent": {
      title: "Sales Funnel",
      items: [
        { label: "Leads", value: clampValue((Number(metrics.monthly_leads_required ?? 0) / 40) * 100), display: `${Math.round(Number(metrics.monthly_leads_required ?? 0))}` },
        { label: "Win Rate", value: clampValue(Number(metrics.expected_win_rate_pct ?? 0)), display: `${Math.round(Number(metrics.expected_win_rate_pct ?? 0))}%` },
        { label: "Pipeline", value: clampValue((Number(metrics.pipeline_value ?? 0) / 500000) * 100), display: currencyLabel(metrics.pipeline_value) || "n/a" },
      ],
    },
  };

  return (
    graphMap[name] ?? {
      title: "Advisor Signal",
      items: [
        { label: "Confidence", value: clampValue(Number(turn?.confidence ?? 0)), display: `${turn?.confidence ?? 0}%` },
        { label: "Growth", value: clampValue(Number(snapshot.growth_potential ?? 0)), display: `${Math.round(Number(snapshot.growth_potential ?? 0))}` },
        { label: "Risk", value: clampValue(Number(snapshot.compliance_risk ?? 0)), display: `${Math.round(Number(snapshot.compliance_risk ?? 0))}` },
      ],
    }
  );
}

function getTurnHighlights(turn) {
  return (turn?.key_points ?? []).map((item) => toPlainText(item)).filter(Boolean).slice(0, 2);
}

function getTurnRiskLine(turn) {
  const assumptions = (turn?.assumptions ?? []).map((item) => toPlainText(item)).filter(Boolean);
  return assumptions[0] ?? "";
}

function SimulationView({
  agentMeta,
  result,
  loading,
  error,
  chatMessages,
  chatDraft,
  composerOpen,
  focusedAgentNames,
  activeTypingAgent,
  speakingAgent,
  groupedConversation,
  topConflictByRound,
  displayedRounds,
  currentRound,
  scenarioTitle,
  highestRisk,
  recommendedDirective,
  actionPlan,
  explainability,
  memorySummary,
  scenarioResults,
  validation,
  onToggleConsole,
  onApplySample,
  onChatDraftChange,
  onSubmitChat,
  onShowComposer,
  onToggleFocusedAgent,
  onSelectOnlyFocusedAgent,
  conversationAgentNames,
  onOpenAgentConversation,
  onOpenAgentProfile,
  onClearAgentConversation,
}) {
  const conversationEndRef = useRef(null);
  const speakingMeta = getConversationMeta(agentMeta, speakingAgent);
  const activeConversationMeta =
    conversationAgentNames.length === 1 ? getConversationMeta(agentMeta, conversationAgentNames[0]) : null;
  const filteredRounds = conversationAgentNames.length
    ? groupedConversation
        .map(([round, turns]) => [round, turns.filter((turn) => conversationAgentNames.includes(turn.agent_name))])
        .filter(([, turns]) => turns.length)
    : groupedConversation;
  const latestTurnsByAgent = useMemo(() => {
    const map = new Map();
    groupedConversation.forEach(([, turns]) => {
      turns.forEach((turn) => {
        map.set(turn.agent_name, turn);
      });
    });
    return map;
  }, [groupedConversation]);
  const advisorReplyTurns = useMemo(
    () => conversationAgentNames.map((name) => latestTurnsByAgent.get(name)).filter(Boolean),
    [conversationAgentNames, latestTurnsByAgent],
  );
  const hasAnyDiscussion = groupedConversation.some(([, turns]) => turns.length);
  const visibleTurnCount = filteredRounds.reduce((count, [, turns]) => count + turns.length, 0);
  const latestUserMessage = chatMessages[chatMessages.length - 1] ?? null;
  const earlierUserMessages = useMemo(() => chatMessages.slice(0, -1), [chatMessages]);
  const selectedAdvisorLabels = conversationAgentNames.map((name) => agentMeta[name]?.label ?? name);
  const chatTargetLabels = focusedAgentNames.map((name) => agentMeta[name]?.label ?? name);
  const showingFocusedReplies = conversationAgentNames.length > 0;
  const shouldShowFocusedReplyBadge = shouldShowAdvisorStanceBadge(latestUserMessage?.content ?? "");
  const isDirectAnswerThread =
    (result?.conversation?.length ?? 0) > 0 && result.conversation.every((turn) => turn.agent_name === "General Assistant");
  const directAnswerText = toPlainText(result?.conversation?.[0]?.message ?? "The model will answer directly here.");

  useEffect(() => {
    if (!conversationEndRef.current) {
      return;
    }

    conversationEndRef.current.scrollIntoView({
      behavior: loading ? "smooth" : "auto",
      block: "end",
    });
  }, [chatMessages.length, visibleTurnCount, loading, conversationAgentNames]);

  return (
    <>
      <main className="obsidian-main">
        <section className="obsidian-stream">
          <header className="stream-header">
            <div>
              <div className="header-kicker">
                <span>{loading ? "Analysis Running" : hasAnyDiscussion ? "Analysis Complete" : "Ready To Start"}</span>
                <span className={loading ? "status-dot small" : "status-dot small idle"} />
              </div>
              <h1>{scenarioTitle}</h1>
            </div>
            <div className="round-meter">
              <span>{loading ? `Round ${currentRound || 0} / ${displayedRounds}` : hasAnyDiscussion ? "Review complete" : "Waiting for input"}</span>
              <div className="meter-track">
                <div
                  className="meter-fill"
                  style={{ width: `${Math.max(8, ((currentRound || 1) / displayedRounds) * 100)}%` }}
                />
              </div>
            </div>
          </header>

          <div className="discussion-utility-bar">
            <div className="discussion-utility-copy">
              <strong>Focused on the result</strong>
              <span>
                The Discussion view now gives more room to the debate and final answer. Use the controls below to send a
                new prompt or narrow the advisor replies.
              </span>
            </div>
            <div className="discussion-utility-actions">
              <button type="button" className="secondary-action" onClick={onApplySample}>
                Use Example
              </button>
              <button type="button" className="primary-action" onClick={onToggleConsole}>
                Open Detailed Form
              </button>
            </div>
          </div>

          <div className="stream-body">
            {!hasAnyDiscussion && !loading && !chatMessages.length ? (
              <div className="stream-empty">
                <span className="material-symbols-outlined">terminal</span>
                <h2>Ready To Start</h2>
                <p>Type your business question below or open the detailed form if you want to add numbers first.</p>
              </div>
            ) : null}

            {conversationAgentNames.length ? (
              <div className="conversation-filter-bar" style={{ "--agent-accent": activeConversationMeta?.accent ?? "#ffe16d" }}>
                <div>
                  <strong>
                    {conversationAgentNames.length === 1
                      ? `${activeConversationMeta?.label ?? "Advisor"} conversation`
                      : "Selected advisor conversations"}
                  </strong>
                  <p>
                    Showing only replies from {selectedAdvisorLabels.join(", ")}.
                  </p>
                </div>
                <div className="conversation-filter-actions">
                  {conversationAgentNames.length === 1 ? (
                    <button type="button" className="footer-link" onClick={() => onOpenAgentProfile(conversationAgentNames[0])}>
                      Open advisor profile
                    </button>
                  ) : null}
                  <button type="button" className="footer-link" onClick={onClearAgentConversation}>
                    Show all advisors
                  </button>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="conversation-error-banner" role="alert">
                <span className="material-symbols-outlined">error</span>
                <div>
                  <strong>We could not get a reply just now.</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : null}

            {earlierUserMessages.length ? (
              <section className="round-section user-history-section">
                <div className="round-divider">
                  <div />
                  <span>Earlier notes from you</span>
                  <div />
                </div>

                {earlierUserMessages.map((message, index) => (
                  <article key={message.id ?? `${message.timestamp}-${index}`} className="debate-message user">
                    <div className="message-icon user">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="message-content">
                      <div className="message-meta">
                        <span className="message-name">You</span>
                        <span className="message-time">Earlier message</span>
                      </div>
                      <div className="message-bubble user">{toPlainText(message.content)}</div>
                      {message.targetAgentNames?.length ? (
                        <div className="message-tags">
                          <span className="message-tag soft">
                            Sent to {message.targetAgentNames.map((name) => agentMeta[name]?.label ?? name).join(", ")}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </section>
            ) : null}

            {latestUserMessage ? (
              <section className="round-section latest-user-section">
                <div className="round-divider">
                  <div />
                  <span>Your latest message</span>
                  <div />
                </div>

                <article className="debate-message user latest-user-message">
                  <div className="message-icon user">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="message-content">
                    <div className="message-meta">
                      <span className="message-name">You</span>
                      <span className="message-time">Just sent</span>
                    </div>
                    <div className="message-bubble user">{toPlainText(latestUserMessage.content)}</div>
                    <div className="message-tags">
                      <span className="message-tag soft">
                        {latestUserMessage.targetAgentNames?.length
                          ? `Sent to ${latestUserMessage.targetAgentNames.map((name) => agentMeta[name]?.label ?? name).join(", ")}`
                          : "Sent to all advisors"}
                      </span>
                    </div>
                  </div>
                </article>
              </section>
            ) : null}

            {showingFocusedReplies ? (
              advisorReplyTurns.length ? (
                <section className="round-section advisor-reply-section">
                  <div className="round-divider">
                    <div />
                    <span>{advisorReplyTurns.length === 1 ? "Advisor answer" : "Advisor answers"}</span>
                    <div />
                  </div>

                  <div className="advisor-dashboard-grid focused">
                    {advisorReplyTurns.map((turn) => {
                      const meta = getConversationMeta(agentMeta, turn.agent_name);
                      const stanceClassName = getStanceClassName(turn.stance);

                      return (
                        <AgentDashboardCard
                          key={`${turn.agent_name}-${turn.round}-direct`}
                          meta={meta}
                          turn={turn}
                          stanceClassName={stanceClassName}
                          summary={buildAdvisorParagraph(turn) || buildDirectAdvisorReply(turn, latestUserMessage?.content ?? "")}
                          highlightItems={getTurnHighlights(turn)}
                          riskLine={getTurnRiskLine(turn)}
                          metrics={getTurnMetrics(turn)}
                          showFocusedReplyBadge={shouldShowFocusedReplyBadge}
                          onOpenAgentConversation={onOpenAgentConversation}
                          onOpenAgentProfile={onOpenAgentProfile}
                          isActive={turn.agent_name === speakingAgent && !loading}
                          showLatestReply
                        />
                      );
                    })}
                  </div>
                </section>
              ) : hasAnyDiscussion && !loading ? (
                <div className="stream-empty conversation-empty">
                  <span className="material-symbols-outlined">{activeConversationMeta?.symbol ?? "groups"}</span>
                  <h2>Waiting for advisor replies</h2>
                  <p>The selected advisors have not replied yet. Send your question and their answers will appear here.</p>
                </div>
              ) : null
            ) : (
              filteredRounds.map(([round, turns]) => (
                <section key={round} className="round-section">
                  <div className="round-divider">
                    <div />
                    <span>Round {String(round).padStart(2, "0")}</span>
                    <div />
                  </div>

                  {topConflictByRound.has(round) ? (
                    <div className="conflict-cluster">
                      <div className="conflict-badge">
                        <span className="material-symbols-outlined">warning</span>
                        Key Disagreement
                      </div>
                      <div className="conflict-thread">
                        <p>{toPlainText(topConflictByRound.get(round).description)}</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="advisor-dashboard-grid">
                    {turns.map((turn) => {
                      const meta = getConversationMeta(agentMeta, turn.agent_name);
                      const stanceClassName = getStanceClassName(turn.stance);

                      return (
                        <AgentDashboardCard
                          key={`${turn.agent_name}-${turn.round}`}
                          meta={meta}
                          turn={turn}
                          stanceClassName={stanceClassName}
                          summary={
                            turn.agent_name === "General Assistant"
                              ? toPlainText(turn.message)
                              : buildAdvisorParagraph(turn) || buildRoundSummary(turn)
                          }
                          highlightItems={getTurnHighlights(turn)}
                          riskLine={getTurnRiskLine(turn)}
                          metrics={getTurnMetrics(turn)}
                          onOpenAgentConversation={onOpenAgentConversation}
                          onOpenAgentProfile={onOpenAgentProfile}
                          isActive={turn.agent_name === speakingAgent && !loading}
                        />
                      );
                    })}
                  </div>
                </section>
              ))
            )}

            {loading ? (
              <div className="typing-row">
                <div className="message-icon typing">
                  <span className="material-symbols-outlined">{speakingMeta.symbol}</span>
                </div>
                <div className="typing-pill">
                  <span />
                  <span />
                  <span />
                  <strong>{speakingMeta.label} is thinking...</strong>
                </div>
              </div>
            ) : null}

            <div ref={conversationEndRef} className="conversation-end-anchor" />
          </div>

          <footer className={composerOpen ? "stream-footer" : "stream-footer compact"}>
            {composerOpen ? (
              <form
                className="discussion-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmitChat(chatDraft);
                }}
              >
                <div className="composer-targets">
                  <span className="composer-target-label">Talk to</span>
                  <div className="composer-target-chips">
                    <button
                      type="button"
                      className={focusedAgentNames.length ? "target-chip" : "target-chip active"}
                      onClick={() => onSelectOnlyFocusedAgent("")}
                    >
                      All advisors
                    </button>
                    {Object.entries(agentMeta).map(([name, meta]) => (
                      <button
                        key={name}
                        type="button"
                        className={focusedAgentNames.includes(name) ? "target-chip active" : "target-chip"}
                        style={{ "--target-accent": meta.accent }}
                        onClick={() => onToggleFocusedAgent(name)}
                      >
                        <span className="material-symbols-outlined">{meta.symbol}</span>
                        {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="composer-textarea"
                  rows="3"
                  placeholder={
                    focusedAgentNames.length === 1
                      ? `Ask ${agentMeta[focusedAgentNames[0]]?.label ?? "this advisor"} something in plain language...`
                      : focusedAgentNames.length > 1
                        ? `Ask ${chatTargetLabels.join(", ")} something in plain language...`
                        : "Example: We are a small SaaS company thinking about expanding into hospitals, but we only have 10 months of cash left. Should we launch now or wait?"
                  }
                  value={chatDraft}
                  onChange={(event) => onChatDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (!loading && chatDraft.trim().length >= 20) {
                        onSubmitChat(chatDraft);
                      }
                    }
                  }}
                />
                <div className="composer-actions">
                  <span className="composer-hint">
                    {focusedAgentNames.length === 1
                      ? `Your next message will focus on ${agentMeta[focusedAgentNames[0]]?.label ?? "that advisor"}.`
                      : focusedAgentNames.length > 1
                        ? `Your next message will focus on ${chatTargetLabels.join(", ")}.`
                        : "Tip: mention your market, cash situation, team size, pricing, or any big concern."}
                  </span>
                  <div className="composer-action-group">
                    <span className="composer-status">
                      {loading ? "Advisors are reviewing..." : result ? "Latest reply visible above" : "Ready for your question"}
                    </span>
                    <button type="submit" className="primary-action" disabled={loading || chatDraft.trim().length < 20}>
                      {loading ? "Reviewing..." : "Send"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="composer-reopen-bar">
                <div className="composer-reopen-copy">
                  <strong>Result view expanded</strong>
                  <span>Open the prompt box only when you want to ask the next question.</span>
                </div>
                <button type="button" className="primary-action" onClick={onShowComposer} disabled={loading}>
                  {loading ? "Review In Progress" : "Ask Another Question"}
                </button>
              </div>
            )}
          </footer>
        </section>

        <aside className="obsidian-insights">
          <div className="directive-card">
            <div className="directive-mark">
              <span className="material-symbols-outlined">{isDirectAnswerThread ? "smart_toy" : "gavel"}</span>
            </div>
            <h2>{isDirectAnswerThread ? "Direct Answer" : "Final Recommendation"}</h2>
            <div className="directive-body">
              <p className="directive-title">
                {isDirectAnswerThread
                  ? directAnswerText
                  : result?.final_output
                  ? `${formatDecisionLabel(result.final_output.decision)}: ${toPlainText(recommendedDirective)}`
                  : "Waiting for the team to finish its review"}
              </p>
              {!isDirectAnswerThread ? (
                <div className="directive-score">
                  <div>
                    <span>Confidence</span>
                    <strong>{result?.final_output?.confidence ?? 0}%</strong>
                  </div>
                  <div className="meter-track">
                    <div className="meter-fill" style={{ width: `${result?.final_output?.confidence ?? 0}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <section className="insight-section">
            <h3>{isDirectAnswerThread ? "About This Answer" : "Main Reasons And Risks"}</h3>
            <div className="insight-grid">
              <InsightCard
                icon={isDirectAnswerThread ? "info" : "lightbulb"}
                accent="#ddb7ff"
                title={isDirectAnswerThread ? "Why you got this answer" : "Main Reason"}
                body={toPlainText(
                  result?.final_output?.key_reasons?.[0] ??
                    (isDirectAnswerThread
                      ? "The prompt was handled as a general question instead of a business case."
                      : "The team is waiting to review your case."),
                )}
              />
              <InsightCard
                icon={isDirectAnswerThread ? "tips_and_updates" : "dangerous"}
                accent="#ff8f8f"
                title={isDirectAnswerThread ? "Tip" : "Biggest Risk"}
                body={toPlainText(highestRisk)}
                kicker={!isDirectAnswerThread && result?.final_output?.risks?.length ? "Critical" : ""}
              />
              <InsightCard
                icon={isDirectAnswerThread ? "forum" : "account_balance"}
                accent="#00ff94"
                title={isDirectAnswerThread ? "Try this next" : "Best Next Step"}
                body={toPlainText(result?.final_output?.recommended_actions?.[0] ?? "No action steps yet.")}
              />
            </div>
          </section>

          <section className="health-panel">
            <h3>{isDirectAnswerThread ? "Suggested Business Prompts" : "Action Plan"}</h3>
            {isDirectAnswerThread ? (
              <div className="execution-list">
                {(result?.final_output?.recommended_actions ?? []).slice(0, 4).map((prompt, index) => (
                  <div key={`${prompt}-${index}`} className="execution-item">
                    <strong>{index === 0 ? "Try now" : "Example"}</strong>
                    <div>
                      <p>{toPlainText(prompt)}</p>
                      <span>Use one of these if you want the advisor team to debate a business case.</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="execution-list">
                  {(actionPlan?.execution_plan ?? []).slice(0, 4).map((step, index) => (
                    <div key={`${step.owner}-${index}`} className="execution-item">
                      <strong>{step.timeline}</strong>
                      <div>
                        <p>{toPlainText(step.step)}</p>
                        <span>
                          {step.owner} - {toPlainText(step.success_metric)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!actionPlan?.execution_plan?.length ? (
                    <p className="compact-placeholder">Action steps will appear after the team makes a recommendation.</p>
                  ) : null}
                </div>
                <div className="scenario-grid">
                  {(scenarioResults ?? []).map((scenario) => (
                    <article key={scenario.scenario} className="scenario-card">
                      <div className="scenario-card-top">
                        <strong>{scenario.scenario}</strong>
                        <span>{formatDecisionLabel(scenario.decision)}</span>
                      </div>
                      <p>{toPlainText(scenario.difference_from_base)}</p>
                      <small>{toPlainText(scenario.reasoning_shift?.[0] ?? "The recommendation stayed mostly the same.")}</small>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="health-panel">
            <h3>{isDirectAnswerThread ? "Why The Advisor Team Was Skipped" : "Why This Recommendation Was Made"}</h3>
            <div className="health-block">
              <div className="health-meta">
                <span>{isDirectAnswerThread ? "Answered by" : "Most influential advisor"}</span>
                <span>{explainability?.top_influencer ?? "Pending"}</span>
              </div>
              <p className="insight-paragraph">
                {toPlainText(
                  explainability?.final_reasoning_summary ??
                    (isDirectAnswerThread
                      ? "The model handled this as a general question instead of a business case."
                      : "The team will summarize why it reached this recommendation."),
                )}
              </p>
            </div>
            <div className="health-block">
              {isDirectAnswerThread ? (
                <p className="insight-paragraph">
                  Ask about launch timing, pricing, customers, costs, risk, hiring, or growth if you want the full
                  advisor debate.
                </p>
              ) : (
                <>
                  <div className="health-meta">
                    <span>Past similar cases</span>
                    <span>{memorySummary?.recalled_simulations ?? 0}</span>
                  </div>
                  <p className="insight-paragraph">
                    {toPlainText(
                      memorySummary?.prior_failures?.[0] ??
                        "The system can save past cases and use them in future recommendations.",
                    )}
                  </p>
                </>
              )}
            </div>
            <div className="health-block">
              <div className="health-meta">
                <span>System checks</span>
                <span>{validation?.passed ? "Passed" : loading ? "Running" : "Waiting"}</span>
              </div>
              <div className="validation-grid">
                <ValidationPill label="Decision" ok={validation?.decisions_made} />
                <ValidationPill label="Scenarios" ok={validation?.multiple_scenarios_simulated} />
                <ValidationPill label="Action plan" ok={validation?.actions_generated} />
                <ValidationPill label="Memory" ok={validation?.memory_used} />
              </div>
            </div>
            <div className="health-block">
              <div className="health-meta">
                <span>Disagreements</span>
                <span>{result?.conflicts?.length ?? 0}</span>
              </div>
              <div className="conflict-compact-list">
                {(result?.conflicts ?? []).slice(0, 3).map((conflict, index) => (
                  <div key={`${conflict.topic}-${index}`} className="conflict-compact-item">
                    <strong>{toPlainText(conflict.conflict_type)}</strong>
                    <p>{toPlainText(conflict.description)}</p>
                  </div>
                ))}
                {!result?.conflicts?.length ? (
                  <p className="compact-placeholder">Important disagreements will appear here after the discussion starts.</p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="synapse-strip">
            <div className="synapse-top">
              <span>System status</span>
              <strong>{loading ? "5.8ms" : "2.4ms"} Latency</strong>
            </div>
            <div className="wave" />
          </div>
        </aside>
      </main>

    </>
  );
}

function formatAgentNames(names, agentMeta) {
  return (names ?? []).slice(0, 3).map((name) => agentMeta[name]?.label ?? name.replace(" Agent", ""));
}

function getStanceClassName(stance) {
  if (stance === "GO") {
    return "tone-go";
  }
  if (stance === "MODIFY") {
    return "tone-modify";
  }
  return "tone-no-go";
}

function InsightCard({ icon, accent, title, body, kicker }) {
  return (
    <article className="insight-card" style={{ "--insight-accent": accent }}>
      <div className="insight-title-row">
        <div className="insight-title">
          <span className="material-symbols-outlined">{icon}</span>
          <strong>{title}</strong>
        </div>
        {kicker ? <span className="insight-kicker">{kicker}</span> : null}
      </div>
      <p>{body}</p>
    </article>
  );
}

function ValidationPill({ label, ok }) {
  return <span className={ok ? "validation-pill ok" : "validation-pill"}>{label}</span>;
}

function AgentDashboardCard({
  meta,
  turn,
  stanceClassName,
  summary,
  highlightItems,
  riskLine,
  metrics,
  onOpenAgentConversation,
  onOpenAgentProfile,
  isActive,
  showLatestReply = false,
  showFocusedReplyBadge = false,
}) {
  const reasoning = buildExpandedReasoningText(turn);
  const graph = buildAgentGraph(turn);

  return (
    <article
      className={isActive ? "advisor-dashboard-card active" : "advisor-dashboard-card"}
      style={{ "--agent-accent": meta.accent }}
    >
      <div className="advisor-dashboard-top">
        <div className="advisor-dashboard-id">
          <div className="advisor-dashboard-icon">
            <span className="material-symbols-outlined">{meta.symbol}</span>
          </div>
          <div>
            <strong>{meta.label}</strong>
            <span>{showLatestReply ? "Latest reply" : `Round ${turn.round}`}</span>
          </div>
        </div>
        <div className="advisor-dashboard-badges">
          <span className={`message-tag ${stanceClassName}`}>
            {showFocusedReplyBadge ? formatAdvisorStanceLabel(turn.stance) : formatDecisionLabel(turn.stance)}
          </span>
          <span className="message-tag soft">{turn.confidence}% confidence</span>
        </div>
      </div>

      {metrics.length ? (
        <div className="advisor-dashboard-metrics">
          {metrics.map((item) => (
            <div key={item.label} className="advisor-metric-tile">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <div className="advisor-dashboard-graph">
        <div className="advisor-dashboard-graph-head">
          <span className="advisor-dashboard-label">{graph.title}</span>
        </div>
        <div className="advisor-dashboard-bars">
          {graph.items.map((item) => (
            <div key={item.label} className="advisor-bar-item">
              <div className="advisor-bar-copy">
                <span>{item.label}</span>
                <strong>{item.display}</strong>
              </div>
              <div className="advisor-bar-track">
                <div className="advisor-bar-fill" style={{ width: `${clampValue(Number(item.value ?? 0))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="advisor-dashboard-summary">{summary}</p>

      {highlightItems.length ? (
        <div className="advisor-dashboard-section">
          <span className="advisor-dashboard-label">Key Moves</span>
          <ul className="advisor-dashboard-list">
            {highlightItems.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {riskLine ? (
        <div className="advisor-dashboard-risk">
          <span className="advisor-dashboard-label">Watchout</span>
          <p>{riskLine}</p>
        </div>
      ) : null}

      <div className="advisor-dashboard-actions">
        <button type="button" className="footer-link" onClick={() => onOpenAgentConversation(turn.agent_name)}>
          View advisor
        </button>
        <button type="button" className="footer-link" onClick={() => onOpenAgentProfile(turn.agent_name)}>
          Open profile
        </button>
      </div>

      {reasoning ? (
        <details className="message-reasoning">
          <summary>View full reasoning</summary>
          <div className="message-reasoning-body">{reasoning}</div>
        </details>
      ) : null}
    </article>
  );
}

export default SimulationView;
