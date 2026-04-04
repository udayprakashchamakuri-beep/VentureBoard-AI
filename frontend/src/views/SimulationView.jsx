import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeDollarSign,
  Bot,
  Crown,
  Handshake,
  Megaphone,
  Rocket,
  Search,
  ShieldAlert,
  Truck,
  Users,
} from "lucide-react";
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

function clampValue(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function buildFallbackIdeaProfile(turn) {
  const snapshot = turn?.score_snapshot ?? {};
  const name = turn?.agent_name ?? "";
  const dimensionValues = {
    demand: clampValue(Number(snapshot.market_attractiveness ?? 52)),
    pricing: clampValue(Number(snapshot.pricing_power ?? 50)),
    competition: clampValue(Number(snapshot.differentiation_pressure ?? 48)),
    location: clampValue(Math.round(((Number(snapshot.market_attractiveness ?? 50) * 0.55) + 18))),
    operations: clampValue(Number(snapshot.operational_complexity ?? 50)),
    compliance: clampValue(Number(snapshot.compliance_risk ?? 44)),
    friction: clampValue(Number(snapshot.sales_friction ?? 50)),
    finance: clampValue(Number(snapshot.financial_viability ?? 50)),
    talent: clampValue(Number(snapshot.talent_load ?? 48)),
  };
  const detailMap = {
    demand: "Demand fit inferred from the business case and advisor evidence collected so far.",
    pricing: "Pricing room inferred from willingness-to-pay and category positioning signals.",
    competition: "Competitive pressure inferred from the market shape and comparable alternatives.",
    location: "Local fit inferred from audience, geography, and access assumptions in the prompt.",
    operations: "Execution load inferred from setup, delivery, and operational dependencies.",
    compliance: "Compliance burden inferred from permits, safety, privacy, or regulated steps.",
    friction: "Sales friction inferred from buyer process, onboarding drag, and switching barriers.",
    finance: "Commercial fit inferred from revenue quality and the board's economics discussion.",
    talent: "Talent load inferred from specialist hiring, support, and enablement requirements.",
  };
  const profileMap = {
    "CEO Agent": [
      ["Demand", "demand"],
      ["Price", "pricing"],
      ["Friction", "friction"],
      ["Competition", "competition"],
    ],
    "Startup Builder Agent": [
      ["Demand", "demand"],
      ["Local Fit", "location"],
      ["Ops Load", "operations"],
      ["Compliance", "compliance"],
    ],
    "Market Research Agent": [
      ["Demand", "demand"],
      ["Local Fit", "location"],
      ["Price", "pricing"],
      ["Competition", "competition"],
    ],
    "Finance Agent": [
      ["Revenue Fit", "finance"],
      ["Price", "pricing"],
      ["Friction", "friction"],
      ["Ops Load", "operations"],
    ],
    "Marketing Agent": [
      ["Audience", "demand"],
      ["Local Buzz", "location"],
      ["Noise", "competition"],
      ["Offer", "pricing"],
    ],
    "Pricing Agent": [
      ["Budget Fit", "pricing"],
      ["Demand", "demand"],
      ["Noise", "competition"],
      ["Friction", "friction"],
    ],
    "Supply Chain Agent": [
      ["Local Fit", "location"],
      ["Ops Load", "operations"],
      ["Compliance", "compliance"],
      ["Friction", "friction"],
    ],
    "Hiring Agent": [
      ["Demand", "demand"],
      ["Talent", "talent"],
      ["Ops Load", "operations"],
      ["Support", "compliance"],
    ],
    "Risk Agent": [
      ["Compliance", "compliance"],
      ["Ops Load", "operations"],
      ["Dependence", "competition"],
      ["Friction", "friction"],
    ],
    "Sales Strategy Agent": [
      ["Urgency", "demand"],
      ["Ticket", "pricing"],
      ["Cycle", "friction"],
      ["Noise", "competition"],
    ],
  };

  return {
    title: "Startup idea profile",
    subtitle: "Idea-specific fit built from the current business case",
    series: (profileMap[name] ?? profileMap["CEO Agent"]).map(([label, key]) => ({
      label,
      topic: key,
      value: dimensionValues[key],
      detail: detailMap[key],
    })),
  };
}

function buildAgentGraph(turn) {
  const researchSnapshot = turn?.research_snapshot ?? {};
  const name = turn?.agent_name ?? "";
  const topicLabels = {
    demand: "Demand",
    competition: "Competition",
    pricing: "Pricing",
    risk: "Risk",
    location: "Location",
  };
  const sourceLabels = {
    firecrawl: "Firecrawl",
    brightdata: "Bright Data",
    unknown: "Other",
  };

  const topicEntries = Object.entries(researchSnapshot.topic_counts ?? {}).slice(0, 4);
  const maxTopicCount = Math.max(...topicEntries.map(([, count]) => Number(count) || 0), 1);
  const barItems = topicEntries.map(([topic, count]) => ({
    label: topicLabels[topic] ?? topic,
    value: Number(count) || 0,
    height: `${clampValue(((Number(count) || 0) / maxTopicCount) * 100, 18, 100)}%`,
    display: `${count} hits`,
  }));

  const rawSourceEntries = Object.entries(researchSnapshot.source_counts ?? {}).filter(([, count]) => Number(count) > 0);
  const sourcePalette = ["#a78bfa", "#60a5fa", "#34d399", "#f59e0b"];
  const sourceItems = rawSourceEntries.map(([source, count], index) => ({
    label: sourceLabels[source] ?? source,
    value: Number(count) || 0,
    color: sourcePalette[index % sourcePalette.length],
  }));
  const startupProfile = researchSnapshot.idea_profile ?? buildFallbackIdeaProfile(turn);
  const ideaItems = (startupProfile.series ?? []).slice(0, 4).map((item) => ({
    label: item.label,
    topic: item.topic,
    value: clampValue(Number(item.value ?? 0)),
    detail: toPlainText(item.detail ?? ""),
  }));

  if (barItems.length) {
    return {
      title: startupProfile.title ?? "Startup idea profile",
      subtitle: startupProfile.subtitle ?? "Startup-specific market shape from your prompt and live web research",
      barItems,
      ideaItems,
      sourceItems,
      sourced: true,
    };
  }

  return {
    title: startupProfile.title ?? `${name.replace(" Agent", "")} idea profile`,
    subtitle: startupProfile.subtitle ?? "Idea-specific fit inferred from the business case",
    barItems: ideaItems.map((item) => ({
      ...item,
      height: `${clampValue(item.value, 18, 100)}%`,
      display: `${Math.round(item.value)}`,
    })),
    ideaItems,
    sourceItems: [],
    sourced: false,
  };
}

function getAgentIcon(agentName) {
  const icons = {
    "CEO Agent": Crown,
    "Startup Builder Agent": Rocket,
    "Market Research Agent": Search,
    "Finance Agent": BadgeDollarSign,
    "Marketing Agent": Megaphone,
    "Pricing Agent": BadgeDollarSign,
    "Supply Chain Agent": Truck,
    "Hiring Agent": Users,
    "Risk Agent": ShieldAlert,
    "Sales Strategy Agent": Handshake,
    "General Assistant": Bot,
  };
  return icons[agentName] ?? Bot;
}

function buildLineChartPoints(items = []) {
  if (!items.length) {
    return "";
  }

  const count = items.length;
  return items
    .map((item, index) => {
      const x = count === 1 ? 110 : 16 + (index * 188) / (count - 1);
      const numeric = Number(item.value ?? 0);
      const y = 108 - clampValue(numeric, 0, 100) * 0.9;
      return `${x},${y}`;
    })
    .join(" ");
}

function getLineChartCoordinates(items = [], index = 0) {
  const count = items.length;
  const x = count === 1 ? 110 : 16 + (index * 188) / Math.max(1, count - 1);
  const numeric = Number(items[index]?.value ?? 0);
  const y = 108 - clampValue(numeric, 0, 100) * 0.9;
  return { x, y };
}

function buildChartLabelLines(label = "") {
  const words = String(label).trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return [label];
  }
  if (words.length === 2) {
    return words;
  }
  return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
}

function buildTooltipLines(item) {
  const detail = toPlainText(item?.detail ?? "");
  if (!detail) {
    return [];
  }
  const sentences = detail.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 2) {
    return sentences.slice(0, 2);
  }
  if (detail.length <= 110) {
    return [detail];
  }
  const midpoint = detail.lastIndexOf(" ", 95);
  if (midpoint > 40) {
    return [detail.slice(0, midpoint), detail.slice(midpoint + 1, midpoint + 95)];
  }
  return [detail.slice(0, 95), detail.slice(95, 190)];
}

function getTurnHighlights(turn) {
  return (turn?.key_points ?? []).map((item) => toPlainText(item)).filter(Boolean).slice(0, 2);
}

function getTurnRiskLine(turn) {
  const assumptions = (turn?.assumptions ?? []).map((item) => toPlainText(item)).filter(Boolean);
  return assumptions[0] ?? "";
}

function buildDirectAssistantNotice(message) {
  const clean = toPlainText(message ?? "");
  const fallback =
    "This question is not related to a business case, so the advisor dashboard was skipped. Ask about launch timing, pricing, customers, costs, hiring, risk, or growth if you want a business review.";

  if (!clean) {
    return fallback;
  }

  if (/not related to business|general question|business case/i.test(clean)) {
    return clean;
  }

  return `This question is not related to a business case. ${clean}`;
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
  const directAnswerText = buildDirectAssistantNotice(
    result?.conversation?.[0]?.message ?? "The model will answer directly here.",
  );

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
            ) : isDirectAnswerThread ? (
              <section className="round-section direct-answer-section">
                <div className="round-divider">
                  <div />
                  <span>Direct answer</span>
                  <div />
                </div>

                <article className="direct-answer-panel">
                  <div className="direct-answer-top">
                    <div className="direct-answer-icon">
                      <Bot size={20} strokeWidth={2.1} />
                    </div>
                    <div>
                      <strong>General Assistant</strong>
                      <span>Business review skipped</span>
                    </div>
                  </div>
                  <p>{directAnswerText}</p>
                </article>
              </section>
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
  onOpenAgentConversation,
  onOpenAgentProfile,
  isActive,
  showLatestReply = false,
  showFocusedReplyBadge = false,
}) {
  const reasoning = buildExpandedReasoningText(turn);
  const graph = buildAgentGraph(turn);
  const Icon = getAgentIcon(turn.agent_name);
  const linePoints = buildLineChartPoints(graph.ideaItems);
  const [hoveredIdeaIndex, setHoveredIdeaIndex] = useState(-1);
  const hoveredIdea = hoveredIdeaIndex >= 0 ? graph.ideaItems[hoveredIdeaIndex] : null;
  const hoveredCoordinates =
    hoveredIdeaIndex >= 0 ? getLineChartCoordinates(graph.ideaItems, hoveredIdeaIndex) : null;

  return (
    <article
      className={isActive ? "advisor-dashboard-card active" : "advisor-dashboard-card"}
      style={{ "--agent-accent": meta.accent }}
    >
      <div className="advisor-dashboard-top">
        <div className="advisor-dashboard-id">
          <div className="advisor-dashboard-icon">
            <Icon size={20} strokeWidth={2.1} />
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

      <div className="advisor-dashboard-graph">
        <div className="advisor-dashboard-graph-head">
          <div>
            <span className="advisor-dashboard-label">{graph.title}</span>
            <p className="advisor-dashboard-graph-note">{graph.subtitle}</p>
          </div>
        </div>
        <div className="advisor-dashboard-chart-grid">
          <div className="advisor-line-panel">
            {hoveredIdea && hoveredCoordinates ? (
              <div
                className="advisor-line-tooltip"
                style={{
                  left: `${(hoveredCoordinates.x / 220) * 100}%`,
                  top: `${Math.max(6, (hoveredCoordinates.y / 132) * 100 - 10)}%`,
                }}
              >
                <strong>
                  {hoveredIdea.label} {Math.round(hoveredIdea.value)}
                </strong>
                {buildTooltipLines(hoveredIdea).map((line, index) => (
                  <span key={`${hoveredIdea.label}-tooltip-${index}`}>{line}</span>
                ))}
              </div>
            ) : null}
            <svg viewBox="0 0 220 132" className="advisor-line-chart" aria-hidden="true">
              {[24, 52, 80, 108].map((y) => (
                <line key={`h-${y}`} x1="12" y1={y} x2="208" y2={y} className="advisor-line-grid" />
              ))}
              {graph.ideaItems.map((item, index) => {
                const { x, y } = getLineChartCoordinates(graph.ideaItems, index);
                const labelLines = buildChartLabelLines(item.label);
                return (
                  <g
                    key={item.label}
                    className="advisor-line-hotspot"
                    onMouseEnter={() => setHoveredIdeaIndex(index)}
                    onMouseLeave={() => setHoveredIdeaIndex(-1)}
                  >
                    <circle cx={x} cy={y} r="5.5" className="advisor-line-point" />
                    <circle cx={x} cy={y} r="14" className="advisor-line-hitbox" />
                    <text x={x} y="121" textAnchor="middle" className="advisor-line-label">
                      {labelLines.map((line, lineIndex) => (
                        <tspan key={`${item.label}-${lineIndex}`} x={x} dy={lineIndex === 0 ? 0 : 8}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
              <polyline points={linePoints} className="advisor-line-path" />
            </svg>
          </div>

          <div className="advisor-vertical-chart">
            {graph.barItems.map((item) => (
              <div key={item.label} className="advisor-vertical-item">
                <span className="advisor-vertical-value">{item.display}</span>
                <div className="advisor-vertical-track">
                  <div className="advisor-vertical-fill" style={{ height: item.height }} />
                </div>
                <span className="advisor-vertical-label">{item.label}</span>
              </div>
            ))}
          </div>

          {graph.sourceItems.length ? (
            <div className="advisor-source-legend advisor-source-legend-wide">
              {graph.sourceItems.map((item) => (
                <div key={item.label} className="advisor-source-chip">
                  <i style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
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
