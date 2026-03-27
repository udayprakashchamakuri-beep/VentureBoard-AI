function AgentsView({ agentCards, loading, matrixStats }) {
  return (
    <div className="command-canvas">
      <header className="view-header">
        <div>
          <div className="view-kicker-row">
            <span className="status-chip success">LIVE</span>
            <span className="muted-code">Advisors ready</span>
          </div>
          <h1>Advisory Team</h1>
          <p>
            Meet the specialists reviewing your case. This page shows what each advisor focuses on and how active they
            are right now.
          </p>
        </div>

        <div className="header-callouts">
          <article className="alert-card danger">
            <span>Admin controls</span>
            <button type="button">Pause review</button>
          </article>
          <article className="alert-card accent">
            <span>Overall activity</span>
            <strong>{matrixStats.networkLoad}</strong>
          </article>
        </div>
      </header>

      <section className="agent-matrix-grid">
        {agentCards.map((agent) => (
          <article key={agent.name} className={`agent-matrix-card tone-${agent.tone}`} style={{ "--card-accent": agent.accent }}>
            <div className="matrix-card-main">
              <div className="matrix-card-header">
                <div className="matrix-agent-id">
                  <div className="matrix-agent-icon">
                    <span className="material-symbols-outlined">{agent.symbol}</span>
                  </div>
                  <div>
                    <h3>{agent.label}</h3>
                    <p>{agent.role}</p>
                  </div>
                </div>
                <div className="matrix-agent-stat">
                  <span>{agent.badgeLabel}</span>
                  <strong>{agent.badgeValue}</strong>
                </div>
              </div>

              <div className="matrix-health">
                <div>
                  <span>System health</span>
                  <strong>{agent.health}</strong>
                </div>
                <div className="matrix-health-track">
                  <div style={{ width: agent.health }} />
                </div>
              </div>

              <div className="matrix-body">
                <div className="matrix-visual">
                  <span className="material-symbols-outlined">{agent.visualIcon}</span>
                  <small>{agent.visualLabel}</small>
                </div>
                <div className="matrix-side-metrics">
                  <div>
                    <span>Current activity</span>
                    <strong>{agent.load}</strong>
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
            </div>

            <div className="matrix-card-footer">
              <span>{agent.status}</span>
              <i className="material-symbols-outlined">{agent.footerIcon}</i>
            </div>
          </article>
        ))}

        <article className="agent-matrix-card deploy-card">
          <div className="deploy-orb">
            <span className="material-symbols-outlined">add</span>
          </div>
          <h3>Add New Advisor</h3>
          <p>Create another specialist role</p>
        </article>
      </section>

      <section className="matrix-bottom-grid">
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
              <span key={`${height}-${index}`} style={{ height }} className={index === 4 || (loading && index === 7) ? "live" : ""} />
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
              <p>High-level controls for the review process</p>
            </div>
          </div>

          <div className="override-list">
            {matrixStats.overrides.map((override) => (
              <article key={override.label} className={`override-item tone-${override.tone}`}>
                <div>
                  <strong>{override.label}</strong>
                  <span>{override.detail}</span>
                </div>
                <button type="button" className={override.enabled ? "toggle on" : "toggle"}>
                  <i />
                </button>
              </article>
            ))}
          </div>

          <button type="button" className="wide-secondary">
            View all settings
          </button>
        </div>
      </section>
    </div>
  );
}

export default AgentsView;
