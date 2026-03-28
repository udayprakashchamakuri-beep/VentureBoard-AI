import { useEffect, useMemo, useState } from "react";

function RiskView({ riskMetrics, riskAlerts }) {
  const [shockIntensity, setShockIntensity] = useState(75);
  const [autonomyMode, setAutonomyMode] = useState("balanced");
  const [mapZoom, setMapZoom] = useState(1);
  const [mapView, setMapView] = useState("world");
  const [timeRange, setTimeRange] = useState("4H");
  const [selectedAlertId, setSelectedAlertId] = useState(riskAlerts[0]?.id ?? "");
  const [lastSimulation, setLastSimulation] = useState("");

  useEffect(() => {
    if (!riskAlerts.length) {
      setSelectedAlertId("");
      return;
    }
    if (!riskAlerts.some((alert) => alert.id === selectedAlertId)) {
      setSelectedAlertId(riskAlerts[0].id);
    }
  }, [riskAlerts, selectedAlertId]);

  const selectedAlert = useMemo(
    () => riskAlerts.find((alert) => alert.id === selectedAlertId) ?? riskAlerts[0] ?? null,
    [riskAlerts, selectedAlertId],
  );

  const chartConfig = useMemo(() => {
    if (timeRange === "1H") {
      return {
        path: "M0 146 Q 80 142, 120 138 T 220 130 T 320 122 T 420 116 T 520 98 T 640 86 T 800 74",
        markerTop: "34px",
        label: "Short-term change",
      };
    }
    if (timeRange === "1D") {
      return {
        path: "M0 158 Q 70 146, 140 152 T 260 126 T 380 150 T 520 96 T 660 118 T 800 48",
        markerTop: "46px",
        label: "Daily trend",
      };
    }
    return {
      path: "M0 150 Q 50 140, 100 160 T 200 120 T 300 140 T 400 80 T 500 100 T 600 40 T 700 60 T 800 20",
      markerTop: "18px",
      label: "Four-hour trend",
    };
  }, [timeRange]);

  const mapViewLabel =
    mapView === "world" ? "World view" : mapView === "hotspots" ? "Risk hotspots" : "Supply view";
  const zoomLabel = `${Math.round(mapZoom * 100)}%`;

  function zoomIn() {
    setMapZoom((current) => Math.min(1.6, Number((current + 0.15).toFixed(2))));
  }

  function zoomOut() {
    setMapZoom((current) => Math.max(0.8, Number((current - 0.15).toFixed(2))));
  }

  function changeView() {
    setMapView((current) => (current === "world" ? "hotspots" : current === "hotspots" ? "supply" : "world"));
  }

  function runSimulation() {
    setLastSimulation(
      `The system ran a ${shockIntensity}% stress test with ${autonomyMode} advisor freedom in ${mapViewLabel.toLowerCase()}. Review the highlighted alert and trend chart for the biggest watch-outs.`,
    );
    if (riskAlerts.length) {
      setSelectedAlertId(riskAlerts[0].id);
    }
  }

  return (
    <div className="command-canvas">
      <header className="view-header risk-header">
        <div>
          <div className="view-kicker-row">
            <span className="status-chip danger">HIGH ATTENTION</span>
            <span className="risk-line" />
          </div>
          <h1>Risks To Watch</h1>
        </div>

        <div className="risk-score">
          <span>Overall business safety</span>
          <strong>
            {riskMetrics.globalIndex}
            <small>{riskMetrics.delta}</small>
          </strong>
        </div>
      </header>

      <div className="risk-grid">
        <section className="panel threat-map-panel">
          <div className="map-overlay map-overlay-top">
            <article className="threat-badge danger">
              <span>Main risk</span>
              <strong>{riskMetrics.activeThreat}</strong>
            </article>
            <article className="threat-badge accent">
              <span>Watch item</span>
              <strong>{riskMetrics.observation}</strong>
            </article>
          </div>

          <div className="threat-map">
            <div className={`threat-map-inner view-${mapView}`} style={{ transform: `scale(${mapZoom})` }}>
              <div className="scan-layer" />
              <div className="threat-orb orb-a" />
              <div className="threat-orb orb-b" />
              <div className="threat-orb orb-c" />
              <div className="threat-grid-lines" />
            </div>
          </div>

          <div className="map-overlay map-overlay-bottom">
            <span className="map-status-chip">{mapViewLabel}</span>
            <span className="map-status-chip">{zoomLabel}</span>
            <button type="button" className="map-control" onClick={zoomIn}>Zoom In</button>
            <button type="button" className="map-control" onClick={zoomOut}>Zoom Out</button>
            <button type="button" className="map-control active" onClick={changeView}>Change view</button>
          </div>
        </section>

        <section className="risk-feed">
          <div className="panel-topline">
            <div>
              <h2>Important Alerts</h2>
              <p>Live feed</p>
            </div>
            <span className="live-feed-dot">LIVE</span>
          </div>

          <div className="risk-alert-list">
            {riskAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                className={selectedAlertId === alert.id ? `risk-alert tone-${alert.tone} active` : `risk-alert tone-${alert.tone}`}
                onClick={() => setSelectedAlertId(alert.id)}
              >
                <div className="risk-alert-meta">
                  <span>{alert.timestamp}</span>
                  <strong>{alert.severity}</strong>
                </div>
                <h3>{alert.title}</h3>
                <p>{alert.body}</p>
              </button>
            ))}
          </div>

          {selectedAlert ? (
            <article className={`alert-detail tone-${selectedAlert.tone}`}>
              <div className="panel-topline">
                <div>
                  <h2>Selected Alert</h2>
                  <p>{selectedAlert.timestamp}</p>
                </div>
                <span className="status-chip outline">{selectedAlert.severity}</span>
              </div>
              <strong>{selectedAlert.title}</strong>
              <p>{selectedAlert.body}</p>
            </article>
          ) : null}
        </section>

        <section className="panel volatility-panel">
          <div className="panel-topline">
            <div>
              <h2>Risk Trend</h2>
              <p>{chartConfig.label}</p>
            </div>
            <div className="legend-row">
              {["1H", "4H", "1D"].map((range) => (
                <button
                  key={range}
                  type="button"
                  className={timeRange === range ? "status-chip accent legend-button active" : "status-chip outline legend-button"}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="volatility-chart">
            <svg viewBox="0 0 800 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="volatilityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffe16d" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#ffe16d" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={chartConfig.path}
                fill="none"
                stroke="#ffe16d"
                strokeWidth="2"
              />
              <path
                d={`${chartConfig.path} L 800 200 L 0 200 Z`}
                fill="url(#volatilityGradient)"
              />
            </svg>
            <div className="volatility-marker" style={{ top: chartConfig.markerTop }} />
          </div>

          <div className="volatility-stats">
            {riskMetrics.stats.map((stat) => (
              <article key={stat.label}>
                <span>{stat.label}</span>
                <strong className={stat.tone === "success" ? "success-text" : ""}>{stat.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="panel sandbox-panel">
          <div className="panel-topline">
            <div>
              <h2>Scenario Tester</h2>
              <p>Try different conditions before deciding</p>
            </div>
            <span className="material-symbols-outlined tertiary-icon">science</span>
          </div>

          <div className="sandbox-stack">
            <label className="slider-block">
              <div>
                <span>How difficult the market becomes</span>
                <strong>{shockIntensity}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={shockIntensity}
                onChange={(event) => setShockIntensity(Number(event.target.value))}
              />
            </label>

            <div className="choice-block">
              <div>
                <span>How much freedom the advisors have</span>
                <strong>{autonomyMode}</strong>
              </div>
              <div className="choice-row">
                {["safe", "balanced", "aggressive"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={autonomyMode === mode ? "mode-button active" : "mode-button"}
                    onClick={() => setAutonomyMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <article className="active-scenario">
              <span>Current test case</span>
              <div>
                <i className="material-symbols-outlined">emergency_share</i>
                <div>
                  <strong>Major operating disruption</strong>
                  <p>Estimated recovery time: 144 hours</p>
                </div>
              </div>
            </article>

            <button type="button" className="execute-shock" onClick={runSimulation}>
              Run this test case
            </button>
            {lastSimulation ? <p className="sandbox-result">{lastSimulation}</p> : null}
          </div>
        </section>
      </div>

      <section className="risk-kpi-grid">
        {riskMetrics.indicators.map((indicator) => (
          <article key={indicator.label} className={`risk-kpi tone-${indicator.tone}`}>
            <span>{indicator.label}</span>
            <strong>{indicator.value}</strong>
          </article>
        ))}
      </section>

      <footer className="command-footer">
        <div>
          <span className="command-footer-live">
            <i />
            System healthy
          </span>
          <span>Lat: 34.0522 deg N | Long: 118.2437 deg W</span>
        </div>
        <div>
          <span>Session: 88-X-19</span>
          <span>v4.0.8</span>
        </div>
      </footer>
    </div>
  );
}

export default RiskView;
