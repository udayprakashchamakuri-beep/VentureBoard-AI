import { useEffect, useMemo, useState } from "react";
import { getAudienceModeConfig } from "../audienceMode";

const OFFICE_PHASE_MS = 12000;
const DEBATE_PHASE_MS = 12000;
const TOTAL_PHASE_MS = OFFICE_PHASE_MS + DEBATE_PHASE_MS;

const AGENT_ORDER = [
  "CEO Agent",
  "Startup Builder Agent",
  "Market Research Agent",
  "Finance Agent",
  "Marketing Agent",
  "Pricing Agent",
  "Supply Chain Agent",
  "Hiring Agent",
  "Risk Agent",
  "Sales Strategy Agent",
];

const OFFICE_ASSIGNMENTS = {
  "Market Research Agent": { left: 21, top: 54, motion: "desk", facing: "south", seat: "desk-a" },
  "Sales Strategy Agent": { left: 37, top: 54, motion: "desk", facing: "south", seat: "desk-b" },
  "Startup Builder Agent": { left: 24, top: 74, motion: "pace-y", facing: "east" },
  "Hiring Agent": { left: 41, top: 73, motion: "desk", facing: "south", seat: "desk-c" },
  "Marketing Agent": { left: 16, top: 81, motion: "pace-x", facing: "east" },
  "Finance Agent": { left: 71, top: 23, motion: "scan", facing: "south" },
  "Pricing Agent": { left: 83, top: 24, motion: "scan", facing: "south" },
  "Risk Agent": { left: 75, top: 61, motion: "brief", facing: "west" },
  "Supply Chain Agent": { left: 82, top: 64, motion: "brief", facing: "west" },
  "CEO Agent": { left: 69, top: 61, motion: "brief", facing: "east" },
};

const BOARDROOM_SEATS = {
  "CEO Agent": { left: 50, top: 23, facing: "south", motion: "lead" },
  "Market Research Agent": { left: 38, top: 35, facing: "east", motion: "listen" },
  "Marketing Agent": { left: 38, top: 46, facing: "east", motion: "listen" },
  "Sales Strategy Agent": { left: 38, top: 57, facing: "east", motion: "listen" },
  "Startup Builder Agent": { left: 38, top: 68, facing: "east", motion: "listen" },
  "Finance Agent": { left: 62, top: 35, facing: "west", motion: "listen" },
  "Pricing Agent": { left: 62, top: 46, facing: "west", motion: "listen" },
  "Risk Agent": { left: 62, top: 57, facing: "west", motion: "listen" },
  "Supply Chain Agent": { left: 62, top: 68, facing: "west", motion: "listen" },
  "Hiring Agent": { left: 50, top: 80, facing: "north", motion: "listen" },
};

const OFFICE_BEATS = [
  { agent: "Market Research Agent", message: "Sizing local demand" },
  { agent: "Marketing Agent", message: "Reading audience signals" },
  { agent: "Sales Strategy Agent", message: "Testing willingness to pay" },
  { agent: "Finance Agent", message: "Checking payback pressure" },
  { agent: "Risk Agent", message: "Mapping failure points" },
  { agent: "CEO Agent", message: "Framing the board call" },
];

const BOARDROOM_BEATS = [
  { agent: "Startup Builder Agent", message: "Make the first move smaller" },
  { agent: "Finance Agent", message: "Hold spend behind clear gates" },
  { agent: "Risk Agent", message: "Do not ignore the main failure mode" },
  { agent: "Sales Strategy Agent", message: "Pilot with one buyer group first" },
  { agent: "CEO Agent", message: "Turn this into one board decision" },
];

function clampPercent(value) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function formatSeconds(ms) {
  return `${Math.max(1, Math.ceil(ms / 1000))}s`;
}

function buildPromptExcerpt(prompt) {
  const clean = String(prompt || "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "Preparing the advisory review.";
  }
  return clean.length > 128 ? `${clean.slice(0, 125)}...` : clean;
}

function getAgentPose(agentName) {
  const poseMap = {
    "CEO Agent": { hair: "#201718", outfit: "#e7d17d", accent: "#7f5d0a" },
    "Startup Builder Agent": { hair: "#33251f", outfit: "#d8844a", accent: "#6d4022" },
    "Market Research Agent": { hair: "#2b2225", outfit: "#6ea9db", accent: "#27486b" },
    "Finance Agent": { hair: "#201b1c", outfit: "#62c7b0", accent: "#1f5b56" },
    "Marketing Agent": { hair: "#6d4a6f", outfit: "#c58be0", accent: "#68426e" },
    "Pricing Agent": { hair: "#2a2422", outfit: "#efc66f", accent: "#8e6c19" },
    "Supply Chain Agent": { hair: "#3f3026", outfit: "#75c2d6", accent: "#315262" },
    "Hiring Agent": { hair: "#8f6d4f", outfit: "#f0abc1", accent: "#7a4d62" },
    "Risk Agent": { hair: "#201718", outfit: "#c97878", accent: "#6d3131" },
    "Sales Strategy Agent": { hair: "#6d4425", outfit: "#e29b57", accent: "#7a4b22" },
  };
  return poseMap[agentName] ?? { hair: "#2b2225", outfit: "#8aa4d9", accent: "#41557f" };
}

function getPhaseMeta(elapsedMs) {
  if (elapsedMs < OFFICE_PHASE_MS) {
    return {
      id: "research",
      label: "Office research",
      summary: "Advisors are scanning customer, money, and risk signals across the office.",
      beats: OFFICE_BEATS,
      localElapsed: elapsedMs,
      localDuration: OFFICE_PHASE_MS,
    };
  }
  return {
    id: "debate",
    label: "Boardroom debate",
    summary: "The team is now arguing the decision in one boardroom before the final memo appears.",
    beats: BOARDROOM_BEATS,
    localElapsed: elapsedMs - OFFICE_PHASE_MS,
    localDuration: DEBATE_PHASE_MS,
  };
}

function getAgentMotion(assignment, elapsedMs, isActive) {
  const time = elapsedMs / 1000;
  switch (assignment.motion) {
    case "pace-x":
      return { x: Math.sin(time * 1.2) * 10, y: Math.cos(time * 0.6) * 1.5 };
    case "pace-y":
      return { x: Math.sin(time * 0.8) * 2, y: Math.cos(time * 1.15) * 9 };
    case "scan":
      return { x: Math.sin(time * 0.6) * 2, y: Math.sin(time * 1.1) * 2 };
    case "brief":
      return { x: Math.sin(time * 0.45) * 1.5, y: Math.cos(time * 0.7) * 3.5 };
    case "lead":
      return { x: 0, y: isActive ? Math.sin(time * 1.3) * 3 : Math.sin(time * 0.55) * 1.5 };
    case "listen":
      return { x: 0, y: Math.sin(time * 0.7) * 1.2 };
    case "desk":
    default:
      return { x: 0, y: Math.sin(time * 0.8) * 1.2 };
  }
}

function PixelProp({ className, style, children }) {
  return (
    <div className={`pixel-prop ${className}`} style={style}>
      {children}
    </div>
  );
}

function PixelAgent({ name, label, accent, assignment, elapsedMs, active, showBubble, bubbleText }) {
  const pose = getAgentPose(name);
  const motion = getAgentMotion(assignment, elapsedMs, active);

  return (
    <div
      className={`pixel-agent facing-${assignment.facing} ${active ? "active" : ""}`}
      style={{
        left: clampPercent(assignment.left),
        top: clampPercent(assignment.top),
        "--agent-accent": accent,
        "--agent-hair": pose.hair,
        "--agent-outfit": pose.outfit,
        "--agent-outfit-shadow": pose.accent,
        transform: `translate(calc(-50% + ${motion.x}px), calc(-50% + ${motion.y}px))`,
      }}
    >
      {showBubble ? <div className="pixel-speech-bubble">{bubbleText}</div> : null}
      <div className="pixel-agent-shadow" />
      <div className="pixel-agent-sprite">
        <span className="pixel-agent-hair" />
        <span className="pixel-agent-head" />
        <span className="pixel-agent-eye left" />
        <span className="pixel-agent-eye right" />
        <span className="pixel-agent-body" />
        <span className="pixel-agent-arm left" />
        <span className="pixel-agent-arm right" />
        <span className="pixel-agent-leg left" />
        <span className="pixel-agent-leg right" />
      </div>
      <span className="pixel-agent-tag">{label}</span>
    </div>
  );
}

function OfficeScene({ agentMeta, activeBeat, elapsedMs }) {
  return (
    <div className="pixel-stage-scene office-scene">
      <div className="pixel-room office-workfloor">
        <div className="pixel-grid-overlay" />
        <PixelProp className="pixel-whiteboard" style={{ left: "5%", top: "8%" }} />
        <PixelProp className="pixel-shelf horizontal" style={{ left: "17%", top: "10%" }} />
        <PixelProp className="pixel-shelf horizontal" style={{ left: "37%", top: "10%" }} />
        <PixelProp className="pixel-desk" style={{ left: "16%", top: "39%" }} />
        <PixelProp className="pixel-desk" style={{ left: "35%", top: "39%" }} />
        <PixelProp className="pixel-desk" style={{ left: "16%", top: "67%" }} />
        <PixelProp className="pixel-desk" style={{ left: "35%", top: "67%" }} />
        <PixelProp className="pixel-chair" style={{ left: "16%", top: "46%" }} />
        <PixelProp className="pixel-chair" style={{ left: "35%", top: "46%" }} />
        <PixelProp className="pixel-chair" style={{ left: "16%", top: "74%" }} />
        <PixelProp className="pixel-chair" style={{ left: "35%", top: "74%" }} />
        <PixelProp className="pixel-plant" style={{ left: "8%", top: "80%" }} />
        <PixelProp className="pixel-plant" style={{ left: "47%", top: "81%" }} />
        <PixelProp className="pixel-box-stack" style={{ left: "9%", top: "18%" }} />

        {["Market Research Agent", "Sales Strategy Agent", "Startup Builder Agent", "Hiring Agent", "Marketing Agent"].map((name) => (
          <PixelAgent
            key={name}
            name={name}
            label={agentMeta[name]?.label ?? name}
            accent={agentMeta[name]?.accent ?? "#9ac9ff"}
            assignment={OFFICE_ASSIGNMENTS[name]}
            elapsedMs={elapsedMs}
            active={activeBeat.agent === name}
            showBubble={activeBeat.agent === name}
            bubbleText={activeBeat.message}
          />
        ))}
      </div>

      <div className="pixel-room office-pantry">
        <div className="pixel-grid-overlay light" />
        <PixelProp className="pixel-shelf horizontal" style={{ left: "22%", top: "10%" }} />
        <PixelProp className="pixel-shelf horizontal" style={{ left: "58%", top: "10%" }} />
        <PixelProp className="pixel-vending" style={{ left: "72%", top: "14%" }} />
        <PixelProp className="pixel-water" style={{ left: "83%", top: "14%" }} />
        <PixelProp className="pixel-clock" style={{ left: "86%", top: "7%" }} />
        <PixelProp className="pixel-coffee" style={{ left: "88%", top: "32%" }} />
        <PixelProp className="pixel-cabinet" style={{ left: "84%", top: "22%" }} />
        {["Finance Agent", "Pricing Agent", "Risk Agent"].map((name) => (
          <PixelAgent
            key={name}
            name={name}
            label={agentMeta[name]?.label ?? name}
            accent={agentMeta[name]?.accent ?? "#9ac9ff"}
            assignment={OFFICE_ASSIGNMENTS[name]}
            elapsedMs={elapsedMs}
            active={activeBeat.agent === name}
            showBubble={activeBeat.agent === name}
            bubbleText={activeBeat.message}
          />
        ))}
      </div>

      <div className="pixel-room office-nook">
        <div className="pixel-grid-overlay blue" />
        <PixelProp className="pixel-frame" style={{ left: "51%", top: "17%" }} />
        <PixelProp className="pixel-shelf horizontal" style={{ left: "18%", top: "18%" }} />
        <PixelProp className="pixel-shelf horizontal" style={{ left: "72%", top: "18%" }} />
        <PixelProp className="pixel-conference-table small" style={{ left: "49%", top: "54%" }} />
        <PixelProp className="pixel-chair side left" style={{ left: "36%", top: "55%" }} />
        <PixelProp className="pixel-chair side right" style={{ left: "62%", top: "55%" }} />
        <PixelProp className="pixel-plant" style={{ left: "17%", top: "76%" }} />
        <PixelProp className="pixel-plant" style={{ left: "82%", top: "76%" }} />
        {["CEO Agent", "Supply Chain Agent"].map((name) => (
          <PixelAgent
            key={name}
            name={name}
            label={agentMeta[name]?.label ?? name}
            accent={agentMeta[name]?.accent ?? "#9ac9ff"}
            assignment={OFFICE_ASSIGNMENTS[name]}
            elapsedMs={elapsedMs}
            active={activeBeat.agent === name}
            showBubble={activeBeat.agent === name}
            bubbleText={activeBeat.message}
          />
        ))}
      </div>
    </div>
  );
}

function BoardroomScene({ agentMeta, activeBeat, elapsedMs }) {
  return (
    <div className="pixel-stage-scene boardroom-scene">
      <div className="pixel-grid-overlay warm" />
      <PixelProp className="pixel-boardroom-picture landscape" style={{ left: "18%", top: "16%" }} />
      <PixelProp className="pixel-boardroom-clock" style={{ left: "50%", top: "14%" }} />
      <PixelProp className="pixel-coffee-machine" style={{ left: "66%", top: "16%" }} />
      <PixelProp className="pixel-boardroom-picture portrait" style={{ left: "9%", top: "49%" }} />
      <PixelProp className="pixel-boardroom-picture portrait warm" style={{ left: "90%", top: "52%" }} />
      <PixelProp className="pixel-plant large" style={{ left: "10%", top: "20%" }} />
      <PixelProp className="pixel-plant large" style={{ left: "90%", top: "20%" }} />
      <PixelProp className="pixel-plant large" style={{ left: "10%", top: "82%" }} />
      <PixelProp className="pixel-plant large" style={{ left: "90%", top: "82%" }} />
      <PixelProp className="pixel-boardroom-table" style={{ left: "50%", top: "56%" }} />
      {AGENT_ORDER.map((name) => (
        <PixelProp
          key={`${name}-chair`}
          className={`pixel-board-chair facing-${BOARDROOM_SEATS[name].facing}`}
          style={{ left: clampPercent(BOARDROOM_SEATS[name].left), top: clampPercent(BOARDROOM_SEATS[name].top) }}
        />
      ))}

      {AGENT_ORDER.map((name) => (
        <PixelAgent
          key={name}
          name={name}
          label={agentMeta[name]?.label ?? name}
          accent={agentMeta[name]?.accent ?? "#9ac9ff"}
          assignment={BOARDROOM_SEATS[name]}
          elapsedMs={elapsedMs}
          active={activeBeat.agent === name}
          showBubble={activeBeat.agent === name}
          bubbleText={activeBeat.message}
        />
      ))}
    </div>
  );
}

export default function PixelReviewSequence({
  agentMeta,
  loadingStartedAt,
  latestPrompt,
  scenarioTitle,
  audienceMode,
}) {
  const [now, setNow] = useState(() => Date.now());
  const audienceConfig = getAudienceModeConfig(audienceMode);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 120);
    return () => window.clearInterval(timer);
  }, [loadingStartedAt]);

  const elapsedMs = Math.max(0, now - (loadingStartedAt ?? now));
  const clampedElapsed = Math.min(elapsedMs, TOTAL_PHASE_MS);
  const phaseMeta = getPhaseMeta(clampedElapsed);
  const beatIndex = Math.floor(phaseMeta.localElapsed / 2200) % phaseMeta.beats.length;
  const activeBeat = phaseMeta.beats[beatIndex];
  const remainingMs = TOTAL_PHASE_MS - clampedElapsed;
  const progress = Math.min(100, Math.round((clampedElapsed / TOTAL_PHASE_MS) * 100));
  const promptExcerpt = useMemo(() => buildPromptExcerpt(latestPrompt), [latestPrompt]);

  return (
    <section className="pixel-review-screen" aria-label="Full-screen advisor review animation">
      <div className="pixel-review-hud">
        <div className="pixel-review-kicker">
          <span>{audienceConfig.label} mode</span>
          <span className="pixel-review-divider" />
          <span>{phaseMeta.label}</span>
        </div>
        <div className="pixel-review-header">
          <div>
            <h1>{scenarioTitle}</h1>
            <p>{phaseMeta.summary}</p>
          </div>
          <div className="pixel-review-timer">
            <strong>{formatSeconds(remainingMs)}</strong>
            <span>until memo</span>
          </div>
        </div>
        <div className="pixel-review-status">
          <div className="pixel-review-progress">
            <div className="pixel-review-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p>{promptExcerpt}</p>
        </div>
        <div className="pixel-review-roster">
          {AGENT_ORDER.map((name) => (
            <span
              key={name}
              className={activeBeat.agent === name ? "pixel-roster-chip active" : "pixel-roster-chip"}
              style={{ "--chip-accent": agentMeta[name]?.accent ?? "#9ac9ff" }}
            >
              {agentMeta[name]?.label ?? name}
            </span>
          ))}
        </div>
      </div>

      <div className="pixel-stage-shell">
        <div className={phaseMeta.id === "research" ? "pixel-scene-frame scene-visible" : "pixel-scene-frame scene-hidden"}>
          <OfficeScene agentMeta={agentMeta} activeBeat={activeBeat} elapsedMs={clampedElapsed} />
        </div>
        <div className={phaseMeta.id === "debate" ? "pixel-scene-frame scene-visible" : "pixel-scene-frame scene-hidden"}>
          <BoardroomScene
            agentMeta={agentMeta}
            activeBeat={activeBeat}
            elapsedMs={phaseMeta.localElapsed}
          />
        </div>
      </div>
    </section>
  );
}
