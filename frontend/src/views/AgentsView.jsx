import { useEffect, useMemo, useState } from "react";
import "../teamPage.css";

function AgentsView({ agentCards, loading, matrixStats, selectedAgentName, onSelectAgent, onOpenAgentConversation }) {
  const safeSelectedAgentName = agentCards.some((agent) => agent.name === selectedAgentName)
    ? selectedAgentName
    : agentCards[0]?.name ?? "";

  const selectedAgent = useMemo(
    () => agentCards.find((agent) => agent.name === safeSelectedAgentName) ?? agentCards[0] ?? null,
    [agentCards, safeSelectedAgentName],
  );

  const [reviewPaused, setReviewPaused] = useState(false);
  const [showAllSettings, setShowAllSettings] = useState(false);
  const [overrideState, setOverrideState] = useState(matrixStats.overrides);

  useEffect(() => {
    setOverrideState(matrixStats.overrides);
  }, [matrixStats.overrides]);

  const visibleOverrides = showAllSettings ? overrideState : overrideState.slice(0, 3);

  function toggleOverride(label) {
    setOverrideState((current) =>
      current.map((override) =>
        override.label === label ? { ...override, enabled: !override.enabled } : override,
      ),
    );
  }

  return (
    <div className="team-page command-canvas">
      <header className="view-header team-header">
        <div>
          <div className="view-kicker-row">
            <span className="status-chip success">LIVE</span>
            <span className="muted-code">Advisors ready</span>
          </div>
          <h1>Advisory Team</h1>
          <p>
            Click any advisor to open a plain-language profile. The cards below show the 10 specialists one by one,
            with simple summaries and easy controls.
          </p>
        </div>

        <div className="header-callouts">
          <article className="alert-card danger">
            <span>{reviewPaused ? "Review paused" : "Team controls"}</span>
            <button type="button" onClick={() => setReviewPaused((current) => !current)}>
              {reviewPaused ? "Resume review" : "Pause review"}
            </button>
          </article>
          <article className="alert-card accent">
            <span>Overall activity</span>
            <strong>{reviewPaused ? "Paused" : matrixStats.networkLoad}</strong>
          </article>
        </div>
      </header>

      <section className="panel team-selector-panel">
        <div className="panel-topline">
          <div>
            <h2>Choose an advisor</h2>
            <p>Use these shortcuts if you want to jump straight to one advisor.</p>
          </div>
        </div>

        <div className="agent-selector-strip">
          {agentCards.map((agent) => (
            <button
              key={agent.name}
              type="button"
              className={safeSelectedAgentName === agent.name ? "agent-selector-chip active" : "agent-selector-chip"}
              style={{ "--chip-accent": agent.accent }}
              onClick={() => onSelectAgent(agent.name)}
              aria-pressed={safeSelectedAgentName === agent.name}
            >
              <span className="material-symbols-outlined">{agent.symbol}</span>
              <span>{agent.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="team-grid">
        {agentCards.map((agent) => (
          <button
            key={agent.name}
            type="button"
            className={
              safeSelectedAgentName === agent.name
                ? `agent-card-shell agent-matrix-card selected tone-${agent.tone}`
                : `agent-card-shell agent-matrix-card tone-${agent.tone}`
            }
            style={{ "--card-accent": agent.accent }}
            onClick={() => onSelectAgent(agent.name)}
            aria-pressed={safeSelectedAgentName === agent.name}
          >
            <div className="matrix-card-main team-card-main">
              <div className="matrix-card-header team-card-header">
                <div className="matrix-agent-id team-agent-id">
                  <div className="matrix-agent-icon team-agent-icon">
                    <span className="material-symbols-outlined">{agent.symbol}</span>
                  </div>
                  <div className="matrix-agent-copy team-agent-copy">
                    <h3>{agent.label}</h3>
                    <p>{agent.role}</p>
                  </div>
                </div>
                <div className="matrix-agent-stat team-agent-stat">
                  <span>{agent.badgeLabel}</span>
                  <strong>{agent.badgeValue}</strong>
                </div>
              </div>

              <div className="matrix-health team-health">
                <div>
                  <span>System health</span>
                  <strong>{agent.health}</strong>
                </div>
                <div className="matrix-health-track">
                  <div style={{ width: agent.health }} />
                </div>
              </div>

              <div className="matrix-body team-body">
                <div className="matrix-visual team-visual">
                  <MiniAgentDiagram bars={agent.historyBars} icon={agent.visualIcon} />
                  <small>{agent.visualLabel}</small>
                </div>
                <div className="matrix-side-metrics team-side-metrics">
                  <div>
                    <span>Current activity</span>
                    <strong>{reviewPaused ? "Paused" : agent.load}</strong>
                  </div>
                  <div>
                    <span>{agent.historyLabel}</span>
                    <div className="mini-history">
                      {agent.historyBars.map((height, index) => (
                        <i key={`${agent.name}-${index}`} style={{ height }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="team-card-summary">{agent.shortSummary}</p>
            </div>

            <div className="matrix-card-footer team-card-footer">
              <span>{reviewPaused ? "Waiting while review is paused" : agent.status}</span>
              <i className="material-symbols-outlined">{agent.footerIcon}</i>
            </div>
          </button>
        ))}
      </section>

      {selectedAgent ? (
        <section className="panel agent-detail-panel team-detail-panel">
          <div className="panel-topline">
            <div>
              <h2>{selectedAgent.label}</h2>
              <p>{selectedAgent.shortSummary}</p>
            </div>
            <div className="agent-detail-status">
              <span>{selectedAgent.latestDecision}</span>
              <strong>{selectedAgent.latestConfidence}</strong>
            </div>
          </div>

          <div className="agent-detail-grid">
            <article className="agent-detail-card">
              <h3>What this advisor looks at</h3>
              <ul className="agent-detail-list">
                {selectedAgent.focusAreas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="agent-detail-card">
              <h3>How this advisor helps</h3>
              <ul className="agent-detail-list">
                {selectedAgent.helpingWith.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="agent-detail-card">
              <h3>Common concerns</h3>
              <ul className="agent-detail-list">
                {selectedAgent.watchOuts.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="agent-detail-card">
              <h3>How this advisor challenges the team</h3>
              <p>{selectedAgent.challengePattern}</p>
              <div className="agent-detail-meta">
                <span>Decision style</span>
                <strong>{selectedAgent.decisionStyle}</strong>
              </div>
            </article>

            <article className="agent-detail-card latest">
              <h3>Latest advice</h3>
              <p>{selectedAgent.latestView}</p>
              <div className="agent-detail-meta">
                <span>Recent highlights</span>
                <strong>{selectedAgent.latestHighlights.join(" | ")}</strong>
              </div>
              <div className="agent-detail-actions">
                <button type="button" className="wide-secondary" onClick={() => onOpenAgentConversation(selectedAgent.name)}>
                  View conversation
                </button>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="matrix-bottom-grid team-bottom-grid">
        <div className="panel history-panel">
          <div className="panel-topline">
            <div>
              <h2>Recent Activity</h2>
              <p>How active the team has been over time</p>
            </div>
            <div className="legend-row">
              <span className="status-chip outline">24H</span>
              <span className="status-chip accent">LIVE</span>
            </div>
          </div>

          <div className="history-bars">
            {matrixStats.performanceBars.map((height, index) => (
              <span
                key={`${height}-${index}`}
                style={{ height }}
                className={index === 4 || (loading && index === 7) ? "live" : ""}
              />
            ))}
          </div>

          <div className="panel-footer spread-row">
            <span>Earlier</span>
            <span>Team activity</span>
            <span>Now</span>
          </div>
        </div>

        <div className="panel override-panel">
          <div className="panel-topline">
            <div>
              <h2>System Settings</h2>
              <p>Use these controls to switch review behavior on or off.</p>
            </div>
          </div>

          <div className="override-list">
            {visibleOverrides.map((override) => (
              <article key={override.label} className={`override-item tone-${override.tone}`}>
                <div>
                  <strong>{override.label}</strong>
                  <span>{override.detail}</span>
                </div>
                <button
                  type="button"
                  className={override.enabled ? "toggle on" : "toggle"}
                  onClick={() => toggleOverride(override.label)}
                  aria-pressed={override.enabled}
                >
                  <i />
                </button>
              </article>
            ))}
          </div>

          <p className="settings-helper-copy">
            {showAllSettings ? "All settings are visible." : "Only the main settings are shown right now."}
          </p>

          <button
            type="button"
            className="wide-secondary"
            onClick={() => setShowAllSettings((current) => !current)}
          >
            {showAllSettings ? "Hide extra settings" : "View all settings"}
          </button>
        </div>
      </section>
    </div>
  );
}

function MiniAgentDiagram({ bars, icon }) {
  const points = bars
    .map((height, index) => {
      const numeric = Number.parseFloat(height);
      const x = 16 + index * 22;
      const y = 80 - numeric * 0.52;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="team-mini-diagram">
      <svg viewBox="0 0 120 88" aria-hidden="true">
        <defs>
          <linearGradient id={`team-line-${icon}`} x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="100%" stopColor="currentColor" />
          </linearGradient>
        </defs>
        <polyline points={points} fill="none" stroke={`url(#team-line-${icon})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {bars.map((height, index) => {
          const numeric = Number.parseFloat(height);
          const x = 16 + index * 22;
          const y = 80 - numeric * 0.52;
          return <circle key={`${icon}-${index}`} cx={x} cy={y} r="3.5" fill="currentColor" />;
        })}
      </svg>
      <span className="material-symbols-outlined team-mini-icon">{icon}</span>
    </div>
  );
}

export default AgentsView;
