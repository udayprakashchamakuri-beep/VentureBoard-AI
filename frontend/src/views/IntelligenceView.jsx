function IntelligenceView({
  scenarioTitle,
  loading,
  intelligenceMetrics,
  semanticStream,
  timelinePoints,
  agentTelemetry,
}) {
  const featuredNodes = agentTelemetry.slice(0, 2);

  return (
    <div className="command-canvas">
      <header className="view-header intelligence-header">
        <div>
          <div className="view-kicker-row">
            <span className="status-chip success">{loading ? "UPDATING" : "LIVE"}</span>
            <span className="muted-code">RESPONSE TIME: {intelligenceMetrics.latency}</span>
          </div>
          <h1>Overview</h1>
          <p>
            A plain-language view of what the advisory team is seeing, discussing, and learning while reviewing{" "}
            {scenarioTitle}.
          </p>
        </div>

        <div className="metric-strip">
          <MetricCard label="Updates reviewed" value={intelligenceMetrics.throughput} accent="finance" suffix="" />
          <MetricCard label="Decision confidence" value={intelligenceMetrics.accuracy} accent="accent" suffix="%" />
          <MetricCard label="Advisors" value={intelligenceMetrics.activeAgents} accent="tertiary" suffix="" />
          <MetricCard label="Open risks" value={intelligenceMetrics.riskVector} accent="danger" suffix="" />
        </div>
      </header>

      <div className="intelligence-grid">
        <section className="panel intelligence-hero">
          <div className="panel-topline">
            <div>
              <h2>Team Activity Map</h2>
              <p>Team activity map</p>
            </div>
            <div className="hero-actions">
              <button type="button" className="icon-button subtle">
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button type="button" className="icon-button subtle">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
          </div>

          <div className="neural-map">
            <div className="neural-rings" />
            <div className="neural-rings secondary" />
            <div className="neural-center" />
            <div className="neural-node node-a" />
            <div className="neural-node node-b" />
            <div className="neural-node node-c" />
            <div className="neural-node node-d" />
            <div className="neural-node node-e" />
            <div className="neural-connection connection-a" />
            <div className="neural-connection connection-b" />
            <div className="neural-connection connection-c" />
            <div className="neural-connection connection-d" />

            {featuredNodes.map((node, index) => (
              <article
                key={node.name}
                className={index === 0 ? "neural-callout callout-left" : "neural-callout callout-right"}
                style={{ "--node-accent": node.accent }}
              >
                <p>{index === 0 ? "Main advisor" : "Supporting advisor"}</p>
                <strong>{node.label}</strong>
                <span>{index === 0 ? `Workload: ${node.load}` : `Health: ${node.health}`}</span>
              </article>
            ))}
          </div>

          <div className="panel-footer status-row">
            <span>
              <i />
              ACTIVE ADVISOR LINKS: {intelligenceMetrics.activeNodes}
            </span>
            <span>
              <i className="accent" />
              SLOWDOWNS: {intelligenceMetrics.bottlenecks}
            </span>
            <strong>REFRESH RATE: 60HZ</strong>
          </div>
        </section>

        <section className="intelligence-side">
          <div className="panel semantic-panel">
            <div className="panel-topline">
              <div>
                <h2>Key Updates</h2>
                <p>Live summary feed</p>
              </div>
              <span className="material-symbols-outlined telemetry-icon">sensors</span>
            </div>

            <div className="semantic-list">
              {semanticStream.map((item) => (
                <article key={item.id} className={`semantic-item tone-${item.tone}`}>
                  <div className="semantic-meta">
                    <span>{item.label}</span>
                    <strong>{item.timestamp}</strong>
                  </div>
                  <p>{item.message}</p>
                </article>
              ))}
            </div>

            <div className="panel-footer center-link">
              <button type="button">View all updates</button>
            </div>
          </div>

          <div className="panel load-panel">
            <div className="load-copy">
              <h3>System Load</h3>
              <strong>{intelligenceMetrics.systemLoad}</strong>
            </div>
            <div className="load-bars">
              {intelligenceMetrics.sparkline.map((height, index) => (
                <span key={`${height}-${index}`} style={{ height }} />
              ))}
            </div>
          </div>
        </section>

        <section className="panel timeline-panel">
          <div className="panel-topline">
            <div>
              <h2>Decision Timeline</h2>
              <p>How the team view changed over each round</p>
            </div>
            <div className="legend-row">
              <span className="legend-item prediction">Early view</span>
              <span className="legend-item actual">Final view</span>
            </div>
          </div>

          <div className="inference-timeline">
            {timelinePoints.map((point) => (
              <div key={point.label} className="timeline-point">
                <div className="timeline-line" style={{ "--predicted": `${point.predicted}%`, "--actual": `${point.actual}%` }}>
                  <span className="marker predicted" />
                  <span className="marker actual" />
                </div>
                <span>{point.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent, suffix }) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <p>{label}</p>
      <div>
        <strong>{value}</strong>
        <span>{suffix}</span>
      </div>
    </article>
  );
}

export default IntelligenceView;
