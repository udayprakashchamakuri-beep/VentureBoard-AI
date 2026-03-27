import { formatDecisionLabel, toPlainText } from "../plainLanguage";

function SimulationView({
  agentMeta,
  result,
  loading,
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
}) {
  const speakingMeta = agentMeta[speakingAgent] ?? agentMeta["CEO Agent"];

  return (
    <>
      <main className="obsidian-main">
        <aside className="obsidian-sidebar">
          <div className="sidebar-header">
            <h2>Advisory Team</h2>
            <span>{Object.keys(agentMeta).length} READY</span>
          </div>

          <div className="agent-stack">
            {Object.entries(agentMeta).map(([name, meta]) => {
              const isActive = name === speakingAgent;
              const isCalculating = loading && name === activeTypingAgent;

              return (
                <article
                  key={name}
                  className={isActive ? "agent-card active" : isCalculating ? "agent-card thinking" : "agent-card"}
                  style={{ "--agent-accent": meta.accent }}
                >
                  <div className="agent-card-head">
                    <span className="material-symbols-outlined">{meta.symbol}</span>
                    {isActive ? (
                      <div className="agent-status-speaking">
                        <span>Talking</span>
                        <div className="signal-bar">
                          <div />
                        </div>
                      </div>
                    ) : null}
                    {!isActive && isCalculating ? <span className="material-symbols-outlined spin">sync</span> : null}
                  </div>
                  <h3>{meta.label}</h3>
                  <p>{meta.title}</p>
                </article>
              );
            })}
          </div>

          <div className="sidebar-module">
            <div className="module-label">How It Works</div>
            <p>
              Enter your business question, key limits, and numbers. The advisory team will discuss it and return a
              recommendation, risks, and next steps.
            </p>
            <div className="module-actions">
              <button type="button" className="secondary-action" onClick={onApplySample}>
                Use Example
              </button>
              <button type="button" className="primary-action" onClick={onToggleConsole}>
                Start Analysis
              </button>
            </div>
          </div>
        </aside>

        <section className="obsidian-stream">
          <header className="stream-header">
            <div>
              <div className="header-kicker">
                <span>Analysis Running</span>
                <span className="status-dot small" />
              </div>
              <h1>{scenarioTitle}</h1>
            </div>
            <div className="round-meter">
              <span>
                Round {currentRound || 0} / {displayedRounds}
              </span>
              <div className="meter-track">
                <div
                  className="meter-fill"
                  style={{ width: `${Math.max(8, ((currentRound || 1) / displayedRounds) * 100)}%` }}
                />
              </div>
            </div>
          </header>

          <div className="stream-body">
            {!result && !loading ? (
              <div className="stream-empty">
                <span className="material-symbols-outlined">terminal</span>
                <h2>Ready To Start</h2>
                <p>Open the form and enter a business decision you want help with.</p>
              </div>
            ) : null}

            {groupedConversation.map(([round, turns]) => (
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

                {turns.map((turn) => {
                  const meta = agentMeta[turn.agent_name] ?? agentMeta["CEO Agent"];

                  return (
                    <article
                      key={`${turn.agent_name}-${turn.round}`}
                      className={turn.agent_name === speakingAgent && !loading ? "debate-message active" : "debate-message"}
                      style={{ "--agent-accent": meta.accent }}
                    >
                      <div className="message-icon">
                        <span className="material-symbols-outlined">{meta.symbol}</span>
                      </div>
                      <div className="message-content">
                        <div className="message-meta">
                          <span className="message-name">{meta.label}</span>
                          <span className="message-time">Round {turn.round} - {turn.confidence}% confidence</span>
                        </div>
                        <div className={turn.stance === "NO GO" ? "message-bubble danger" : "message-bubble"}>
                          {toPlainText(turn.message)}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            ))}

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
          </div>

          <footer className="stream-footer">
            <div className="footer-actions">
              <button type="button" className="footer-link" onClick={onToggleConsole}>
                <span className="material-symbols-outlined">terminal</span>
                Open Form
              </button>
              <button type="button" className="footer-link" onClick={onApplySample}>
                <span className="material-symbols-outlined">history</span>
                Use Example Case
              </button>
            </div>
            <div className="footer-metrics">
              <span>System status: {result ? "Live" : "Waiting"}</span>
              <div className="footer-bars">
                <div />
                <div />
                <div />
                <div />
              </div>
            </div>
          </footer>
        </section>

        <aside className="obsidian-insights">
          <div className="directive-card">
            <div className="directive-mark">
              <span className="material-symbols-outlined">gavel</span>
            </div>
            <h2>Final Recommendation</h2>
            <div className="directive-body">
              <p className="directive-title">
                {result?.final_output
                  ? `${formatDecisionLabel(result.final_output.decision)}: ${toPlainText(recommendedDirective)}`
                  : "Waiting for the team to finish its review"}
              </p>
              <div className="directive-score">
                <div>
                  <span>Confidence</span>
                  <strong>{result?.final_output?.confidence ?? 0}%</strong>
                </div>
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: `${result?.final_output?.confidence ?? 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <section className="insight-section">
            <h3>Main Reasons And Risks</h3>
            <div className="insight-grid">
              <InsightCard
                icon="lightbulb"
                accent="#ddb7ff"
                title="Main Reason"
                body={toPlainText(result?.final_output?.key_reasons?.[0] ?? "The team is waiting to review your case.")}
              />
              <InsightCard
                icon="dangerous"
                accent="#ff8f8f"
                title="Biggest Risk"
                body={toPlainText(highestRisk)}
                kicker={result?.final_output?.risks?.length ? "Critical" : ""}
              />
              <InsightCard
                icon="account_balance"
                accent="#00ff94"
                title="Best Next Step"
                body={toPlainText(result?.final_output?.recommended_actions?.[0] ?? "No action steps yet.")}
              />
            </div>
          </section>

          <section className="health-panel">
            <h3>Action Plan</h3>
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
          </section>

          <section className="health-panel">
            <h3>Why This Recommendation Was Made</h3>
            <div className="health-block">
              <div className="health-meta">
                <span>Most influential advisor</span>
                <span>{explainability?.top_influencer ?? "Pending"}</span>
              </div>
              <p className="insight-paragraph">
                {toPlainText(
                  explainability?.final_reasoning_summary ??
                    "The team will summarize why it reached this recommendation.",
                )}
              </p>
            </div>
            <div className="health-block">
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

      <div className="hud-bar">
        <div className="hud-item">
          <span className="material-symbols-outlined">database</span>
          <div>
            <span>Mode</span>
            <strong>{result ? "Live analysis" : "Ready"}</strong>
          </div>
        </div>
        <div className="hud-divider" />
        <div className="hud-item">
          <span className="material-symbols-outlined">memory</span>
          <div>
            <span>Activity</span>
            <strong>{loading ? "Reviewing" : "Waiting"}</strong>
          </div>
        </div>
        <div className="hud-divider" />
        <button type="button" className="hud-input" onClick={onToggleConsole}>
          <span className="material-symbols-outlined">terminal</span>
          Enter business case...
        </button>
      </div>
    </>
  );
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

export default SimulationView;
