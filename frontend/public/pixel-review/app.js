const TILE = 24;
const COLS = 28;
const ROWS = 20;

const RESEARCH_DURATION_MS = 10_000;
const DEBATE_STEP_MS = 850;
const MOVE_SPEED_TILES = 4.5;
const FIXED_FRAME_MS = 1000 / 60;

const query = new URLSearchParams(window.location.search);
const canvas = document.getElementById("war-room-canvas");
const displayCtx = canvas.getContext("2d");
displayCtx.imageSmoothingEnabled = false;
const sceneCanvas = document.createElement("canvas");
sceneCanvas.width = COLS * TILE;
sceneCanvas.height = ROWS * TILE;
const ctx = sceneCanvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const phaseLabel = document.getElementById("phase-label");
const countdown = document.getElementById("countdown");
const phasePill = document.getElementById("phase-pill");
const miniPhase = document.getElementById("mini-phase");
const replayButton = document.getElementById("replay-button");
const audienceLabel = document.getElementById("audience-label");
const scenarioTitle = document.getElementById("scenario-title");
const promptCopy = document.getElementById("prompt-copy");
const roster = document.getElementById("agent-roster");
const transcript = document.getElementById("transcript");
const verdictBox = document.getElementById("verdict-box");

const palette = {
  bg: "#13161f",
  outline: "#2f2730",
  shadow: "#1b1821",
  wall: "#8c6856",
  wallDark: "#66483d",
  trim: "#dbc9b7",
  trimDark: "#9d8b7e",
  officeWoodA: "#6b4f47",
  officeWoodB: "#5b4139",
  officeWoodLine: "#46322d",
  boardWoodA: "#c98a5b",
  boardWoodB: "#b7784d",
  boardWoodLine: "#8c5e3d",
  tileA: "#ccd3e2",
  tileB: "#bfc8d8",
  tileLight: "#f2f4ff",
  tileDark: "#8893aa",
  deskTop: "#ece0d5",
  deskFront: "#a8b4c8",
  deskShadow: "#728097",
  metal: "#717c96",
  monitor: "#81e6ff",
  monitorDark: "#20303d",
  paper: "#fbf7ed",
  paperLine: "#b8b3a5",
  mug: "#d86d66",
  plantLeaf: "#5aa06d",
  plantLeafDark: "#447955",
  plantPot: "#cb855d",
  planter: "#a5674c",
  frame: "#69473c",
  frameArtA: "#7bd4ff",
  frameArtB: "#79c179",
  frameArtC: "#db8a5e",
  coffee: "#d2d6e4",
  water: "#84deff",
  table: "#c79064",
  tableDark: "#8f5f43",
  tableHighlight: "#ddb08b",
  bubbleFill: "#fff3d5",
  bubbleBorder: "#41313b",
  bubbleText: "#231c21",
  text: "#eef8ff",
  darkText: "#251d28",
  labelBg: "#081117",
  labelText: "#d8f2ff",
};

const desks = [
  { x: 2, y: 2, w: 3, h: 2, seat: { x: 3, y: 4 } },
  { x: 8, y: 2, w: 3, h: 2, seat: { x: 9, y: 4 } },
  { x: 2, y: 6, w: 3, h: 2, seat: { x: 3, y: 8 } },
  { x: 8, y: 6, w: 3, h: 2, seat: { x: 9, y: 8 } },
  { x: 5, y: 10, w: 3, h: 2, seat: { x: 6, y: 12 } },
  { x: 17, y: 2, w: 3, h: 2, seat: { x: 18, y: 4 } },
  { x: 23, y: 2, w: 3, h: 2, seat: { x: 24, y: 4 } },
  { x: 17, y: 6, w: 3, h: 2, seat: { x: 18, y: 8 } },
  { x: 23, y: 6, w: 3, h: 2, seat: { x: 24, y: 8 } },
  { x: 20, y: 10, w: 3, h: 2, seat: { x: 21, y: 12 } },
];

const table = { x: 10, y: 12, w: 8, h: 6 };
const officeCamera = { x: 1 * TILE, y: 1 * TILE, width: 26 * TILE, height: 13 * TILE };
const conferenceCamera = { x: 3 * TILE, y: 6 * TILE, width: 22 * TILE, height: 13.5 * TILE };

const conferenceSeats = [
  { x: 13, y: 11, facing: "south" },
  { x: 9, y: 13, facing: "east" },
  { x: 18, y: 13, facing: "west" },
  { x: 9, y: 14, facing: "east" },
  { x: 18, y: 14, facing: "west" },
  { x: 9, y: 15, facing: "east" },
  { x: 18, y: 15, facing: "west" },
  { x: 9, y: 16, facing: "east" },
  { x: 18, y: 16, facing: "west" },
  { x: 13, y: 18, facing: "north" },
];

const agentSpecs = [
  {
    id: "ceo",
    name: "Mara",
    role: "CEO",
    color: "#77f7c6",
    chairColor: "#d35757",
    skin: "#f2c8a0",
    hair: "#7b563f",
    outfit: "#24486e",
    accent: "#f3f5fc",
    hairStyle: "swept",
    topStyle: "vest",
    research: ["Framing the wedge", "Syncing strategy", "Reviewing signal"],
    callout: "Narrow wedge first",
    debate:
      "We should lead with a narrow wedge where the founder can sell manually and learn fast.",
  },
  {
    id: "sales",
    name: "Ivo",
    role: "Sales",
    color: "#42cfff",
    chairColor: "#4c84d0",
    skin: "#efbd93",
    hair: "#c28a58",
    outfit: "#33333b",
    accent: "#ffbb79",
    hairStyle: "waves",
    topStyle: "jacket",
    research: ["Buyer pain scan", "Budget owner check", "Urgency scoring"],
    callout: "Find burning pain",
    debate:
      "Outbound can work if we target operators with acute workflow chaos and a short payback story.",
  },
  {
    id: "marketing",
    name: "Sol",
    role: "Marketing",
    color: "#7aa9ff",
    chairColor: "#6b8dff",
    skin: "#d79d72",
    hair: "#26232a",
    outfit: "#c65f35",
    accent: "#253d76",
    hairStyle: "afro",
    topStyle: "jacket",
    research: ["Channel fit", "Positioning test", "Category language"],
    callout: "Own the category",
    debate: "The positioning should promise operational calm, not generic AI automation.",
  },
  {
    id: "product",
    name: "June",
    role: "Product",
    color: "#ffb26b",
    chairColor: "#3db8a7",
    skin: "#ebb88e",
    hair: "#2f353d",
    outfit: "#c34a5e",
    accent: "#f4d77d",
    hairStyle: "bob",
    topStyle: "blouse",
    research: ["Workflow review", "Activation path", "Feature ranking"],
    callout: "One loop only",
    debate:
      "The MVP only needs one critical loop done exceptionally well, not a broad command center on day one.",
  },
  {
    id: "finance",
    name: "Noor",
    role: "Finance",
    color: "#ffd671",
    chairColor: "#8e67d8",
    skin: "#f0c8ab",
    hair: "#dadce6",
    outfit: "#f1f1ef",
    accent: "#9ba3ca",
    hairStyle: "silver",
    topStyle: "coat",
    research: ["Runway stress", "ACV floor", "Margin profile"],
    callout: "Protect margin",
    debate:
      "The plan is investable if implementation stays light and the first segment can support high ACV.",
  },
  {
    id: "ops",
    name: "Keon",
    role: "Operations",
    color: "#f0a6ff",
    chairColor: "#e4b33a",
    skin: "#eab488",
    hair: "#67422d",
    outfit: "#dce6f2",
    accent: "#2d6da8",
    hairStyle: "spike",
    topStyle: "shirt",
    research: ["Team load", "Process depth", "Delivery risk"],
    callout: "Keep ops lean",
    debate:
      "Operational lift needs to stay low or the product becomes a services-heavy trap.",
  },
  {
    id: "research",
    name: "Aya",
    role: "Research",
    color: "#7ef0b6",
    chairColor: "#c95d8c",
    skin: "#efc59e",
    hair: "#5a3b27",
    outfit: "#3c6760",
    accent: "#bff6d9",
    hairStyle: "bun",
    topStyle: "jacket",
    research: ["Market shifts", "Competitor edges", "Unmet jobs"],
    callout: "Space still open",
    debate:
      "There is room if we avoid broad productivity claims and own one painful workflow deeply.",
  },
  {
    id: "legal",
    name: "Tess",
    role: "Legal",
    color: "#c0d3ff",
    chairColor: "#4f73c8",
    skin: "#e7b896",
    hair: "#4f5664",
    outfit: "#70809a",
    accent: "#f5f7fb",
    hairStyle: "crop",
    topStyle: "coat",
    research: ["Policy scan", "Procurement drag", "Compliance load"],
    callout: "Trust matters",
    debate:
      "Enterprise trust will depend on a clean security narrative and limited data exposure in the first release.",
  },
  {
    id: "customer",
    name: "Rian",
    role: "Customer",
    color: "#ff8aa0",
    chairColor: "#69b85c",
    skin: "#f1c6a0",
    hair: "#915f3c",
    outfit: "#d47479",
    accent: "#ffd9a0",
    hairStyle: "long",
    topStyle: "dress",
    research: ["User calls", "Language cues", "Request ranking"],
    callout: "Speak customer",
    debate:
      "Customers will buy relief from repetition if the product speaks in their daily operating language.",
  },
  {
    id: "investor",
    name: "Vale",
    role: "Investor Lens",
    color: "#9af4ff",
    chairColor: "#df8b49",
    skin: "#eac19a",
    hair: "#2b2d36",
    outfit: "#b9bfce",
    accent: "#7de1ff",
    hairStyle: "mop",
    topStyle: "coat",
    research: ["Downside case", "Moat shape", "Timing risk"],
    callout: "Show repeatability",
    debate:
      "The opportunity is attractive if the founder proves repeated wins in one vertical before expanding.",
  },
];

const finalVerdict =
  "Launch a 90-day founder-led pilot in one B2B operations vertical, sell a painful workflow outcome, and delay broad platform expansion until usage proves a repeatable wedge. The AI story should feel like operational clarity, not magic.";

const rosterRefs = new Map();
const transcriptItems = [];
const agents = [];
const wallBlocks = new Set();

let phase = "research";
let phaseStartedAt = 0;
let currentSpeakerIndex = -1;
let nextDebateAt = 0;
let lastResearchShuffleAt = 0;
let timelineNow = 0;

if (audienceLabel) {
  audienceLabel.textContent = `${query.get("audience") || "Founder"} mode`;
}

if (scenarioTitle) {
  scenarioTitle.textContent = query.get("scenario") || "Business case review";
}

if (promptCopy) {
  promptCopy.textContent =
    query.get("prompt") || "The advisory team is reviewing the case.";
}

function key(x, y) {
  return `${x},${y}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setPhase(nextPhase, label, pill) {
  phase = nextPhase;
  document.body.dataset.phase = nextPhase;
  phaseLabel.textContent = label;
  phasePill.textContent = pill;
  miniPhase.textContent = label;
}

function createRoster() {
  roster.innerHTML = "";
  rosterRefs.clear();

  for (const spec of agentSpecs) {
    const item = document.createElement("li");
    item.className = "roster-item";
    item.innerHTML = `
      <span class="roster-dot" style="--dot-color:${spec.color}"></span>
      <div>
        <div class="roster-head">
          <strong>${spec.name}</strong>
          <span class="roster-role">${spec.role}</span>
        </div>
        <div class="roster-status"></div>
      </div>
    `;
    roster.appendChild(item);
    rosterRefs.set(spec.id, {
      item,
      status: item.querySelector(".roster-status"),
    });
  }
}

function pushTranscript(role, text) {
  transcriptItems.unshift({ role, text });
  transcriptItems.splice(4);
  renderTranscript();
}

function renderTranscript() {
  if (!transcriptItems.length) {
    transcript.innerHTML = `
      <p class="placeholder-copy">
        Research traffic is live. Watch the bubbles in the room for evidence calls and short
        agent updates.
      </p>
    `;
    return;
  }

  transcript.innerHTML = transcriptItems
    .map(
      (entry) => `
        <article class="transcript-item">
          <span class="transcript-role">${entry.role}</span>
          <p class="transcript-text">${entry.text}</p>
        </article>
      `,
    )
    .join("");
}

function setInitialVerdict() {
  verdictBox.innerHTML = `
    <p class="placeholder-copy">
      Final recommendation will populate when the conference cycle completes.
    </p>
  `;
}

function setFinalVerdict() {
  verdictBox.innerHTML = `
    <h3>Proceed with a narrow founder-led pilot</h3>
    <p>${finalVerdict}</p>
  `;
}

function buildWorld() {
  wallBlocks.clear();

  for (let x = 0; x < COLS; x += 1) {
    wallBlocks.add(key(x, 0));
    wallBlocks.add(key(x, ROWS - 1));
  }

  for (let y = 0; y < ROWS; y += 1) {
    wallBlocks.add(key(0, y));
    wallBlocks.add(key(COLS - 1, y));
  }

  for (let x = table.x; x < table.x + table.w; x += 1) {
    for (let y = table.y; y < table.y + table.h; y += 1) {
      wallBlocks.add(key(x, y));
    }
  }

  for (const desk of desks) {
    for (let x = desk.x; x < desk.x + desk.w; x += 1) {
      for (let y = desk.y; y < desk.y + desk.h; y += 1) {
        wallBlocks.add(key(x, y));
      }
    }
  }

  for (let x = 11; x <= 16; x += 1) {
    wallBlocks.add(key(x, 2));
  }

  for (let x = 11; x <= 16; x += 1) {
    wallBlocks.add(key(x, 3));
  }
}

function createAgents() {
  agents.length = 0;

  agentSpecs.forEach((spec, index) => {
    const start = desks[index].seat;
    const seat = conferenceSeats[index];

    agents.push({
      ...spec,
      desk: desks[index],
      seat,
      position: { x: start.x, y: start.y },
      tile: { x: start.x, y: start.y },
      path: [],
      pathIndex: 0,
      hasDeparted: false,
      hasArrived: false,
      isSpeaking: false,
      bubble: spec.research[0].toUpperCase(),
      status: spec.research[0],
      nextResearchIndex: 0,
      bounceSeed: index * 0.7 + 1,
    });
  });
}

function resetSceneState(now = performance.now()) {
  createAgents();
  transcriptItems.length = 0;
  renderTranscript();
  setInitialVerdict();
  setPhase("research", "Office research", "Researching");
  phaseStartedAt = now;
  currentSpeakerIndex = -1;
  nextDebateAt = 0;
  lastResearchShuffleAt = now;
  countdown.textContent = "00:10";
  syncRoster();
}

function syncRoster() {
  for (const agent of agents) {
    const ref = rosterRefs.get(agent.id);
    if (!ref) continue;
    ref.status.textContent = agent.status;
    ref.item.style.opacity = agent.isSpeaking ? "1" : "0.86";
    ref.item.style.borderColor = agent.isSpeaking ? "#265868" : "";
  }
}

function formatCountdown(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `00:${seconds.toString().padStart(2, "0")}`;
}

function neighbors(node) {
  return [
    { x: node.x + 1, y: node.y },
    { x: node.x - 1, y: node.y },
    { x: node.x, y: node.y + 1 },
    { x: node.x, y: node.y - 1 },
  ];
}

function buildPath(start, goal) {
  const queue = [start];
  const visited = new Set([key(start.x, start.y)]);
  const previous = new Map();
  const goalKey = key(goal.x, goal.y);

  while (queue.length) {
    const current = queue.shift();
    if (key(current.x, current.y) === goalKey) break;

    for (const next of neighbors(current)) {
      if (next.x < 1 || next.x >= COLS - 1 || next.y < 1 || next.y >= ROWS - 1) continue;
      const nextKey = key(next.x, next.y);
      if (visited.has(nextKey)) continue;
      if (wallBlocks.has(nextKey) && nextKey !== goalKey) continue;
      visited.add(nextKey);
      previous.set(nextKey, current);
      queue.push(next);
    }
  }

  if (!previous.has(goalKey) && key(start.x, start.y) !== goalKey) return [];

  const path = [goal];
  let cursor = goal;

  while (key(cursor.x, cursor.y) !== key(start.x, start.y)) {
    const prev = previous.get(key(cursor.x, cursor.y));
    if (!prev) break;
    path.unshift(prev);
    cursor = prev;
  }

  return path;
}

function startTransition(now) {
  setPhase("transition", "Conference handoff", "Taking seats");
  phaseStartedAt = now;
  countdown.textContent = "LIVE";

  for (const agent of agents) {
    agent.status = "Walking to conference";
    agent.bubble = "";
    agent.isSpeaking = false;
    agent.hasDeparted = false;
    agent.hasArrived = false;
    agent.path = [];
    agent.pathIndex = 0;
  }

  syncRoster();
}

function startDebate(now) {
  setPhase("debate", "Conference debate", "Debating");
  phaseStartedAt = now;
  currentSpeakerIndex = -1;
  nextDebateAt = now + 800;

  for (const agent of agents) {
    agent.status = "Listening";
    agent.bubble = "";
    agent.isSpeaking = false;
  }

  syncRoster();
}

function startDelivery(now) {
  setPhase("delivery", "Decision ready", "Memo ready");
  phaseStartedAt = now;
  setFinalVerdict();

  for (const agent of agents) {
    agent.isSpeaking = false;
    agent.bubble = "";
    agent.status = "Debate complete";
  }

  const ceo = agents[0];
  ceo.isSpeaking = true;
  ceo.bubble = "PILOT ONE WORKFLOW";
  ceo.status = "Delivering final recommendation";
  syncRoster();
}

function advanceDebate(now) {
  for (const agent of agents) {
    agent.isSpeaking = false;
    agent.bubble = "";
    agent.status = "Listening";
  }

  currentSpeakerIndex += 1;

  if (currentSpeakerIndex >= agents.length) {
    startDelivery(now);
    return;
  }

  const speaker = agents[currentSpeakerIndex];
  speaker.isSpeaking = true;
  speaker.bubble = speaker.callout.toUpperCase();
  speaker.status = "Presenting debate point";
  pushTranscript(speaker.role, speaker.debate);
  syncRoster();
  nextDebateAt = now + DEBATE_STEP_MS;
}

function updateResearch(now) {
  const remaining = RESEARCH_DURATION_MS - (now - phaseStartedAt);
  countdown.textContent = formatCountdown(remaining);

  if (now - lastResearchShuffleAt > 1_900) {
    lastResearchShuffleAt = now;

    for (const agent of agents) {
      agent.nextResearchIndex = (agent.nextResearchIndex + 1) % agent.research.length;
      agent.status = agent.research[agent.nextResearchIndex];
      agent.bubble = "";
      agent.isSpeaking = false;
    }

    const bubbleTargets = [...agents.keys()].sort(() => Math.random() - 0.5).slice(0, 4);
    for (const index of bubbleTargets) {
      agents[index].bubble = agents[index].status.toUpperCase();
    }

    syncRoster();
  }

  if (remaining <= 0) {
    startTransition(now);
  }
}

function updateTransition(now, dt) {
  let arrivedCount = 0;

  agents.forEach((agent, index) => {
    if (!agent.hasDeparted && now - phaseStartedAt >= index * 140) {
      agent.path = buildPath(agent.tile, agent.seat);
      agent.pathIndex = 1;
      agent.hasDeparted = true;
    }

    updateMovement(agent, dt);
    if (agent.hasArrived) {
      arrivedCount += 1;
      agent.status = "Seated at conference";
    }
  });

  syncRoster();

  if (arrivedCount === agents.length) {
    startDebate(now);
  }
}

function updateMovement(agent, dt) {
  if (!agent.hasDeparted || agent.hasArrived) return;
  if (agent.path.length <= 1 || agent.pathIndex >= agent.path.length) {
    agent.hasArrived = true;
    return;
  }

  const next = agent.path[agent.pathIndex];
  const dx = next.x - agent.position.x;
  const dy = next.y - agent.position.y;
  const distance = Math.hypot(dx, dy);
  const step = MOVE_SPEED_TILES * dt;

  if (distance <= step) {
    agent.position.x = next.x;
    agent.position.y = next.y;
    agent.tile.x = next.x;
    agent.tile.y = next.y;
    agent.pathIndex += 1;
    if (agent.pathIndex >= agent.path.length) {
      agent.hasArrived = true;
    }
    return;
  }

  agent.position.x += (dx / distance) * step;
  agent.position.y += (dy / distance) * step;
}

function update(now, dt) {
  if (phase === "research") {
    updateResearch(now);
  } else if (phase === "transition") {
    updateTransition(now, dt);
  } else if (phase === "debate" && now >= nextDebateAt) {
    advanceDebate(now);
  }
}

function fillRectPx(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function fillTile(x, y, color) {
  fillRectPx(x * TILE, y * TILE, TILE, TILE, color);
}

function shadeTile(x, y, top, left, bottom, right) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px, py, TILE, 2, top);
  fillRectPx(px, py, 2, TILE, left);
  fillRectPx(px, py + TILE - 2, TILE, 2, bottom);
  fillRectPx(px + TILE - 2, py, 2, TILE, right);
}

function drawStoneTile(x, y) {
  const base = (x + y) % 2 === 0 ? palette.tileA : palette.tileB;
  fillTile(x, y, base);
  shadeTile(x, y, palette.tileLight, palette.tileLight, palette.tileDark, palette.tileDark);
  fillRectPx(x * TILE + 8, y * TILE + 9, 8, 2, "rgba(97, 108, 135, 0.28)");
}

function drawWoodTile(x, y, isBoardroom = false) {
  const base = isBoardroom
    ? x % 2 === 0
      ? palette.boardWoodA
      : palette.boardWoodB
    : x % 2 === 0
      ? palette.officeWoodA
      : palette.officeWoodB;
  const grain = isBoardroom ? palette.boardWoodLine : palette.officeWoodLine;
  fillTile(x, y, base);
  fillRectPx(x * TILE + 5, y * TILE, 2, TILE, grain);
  fillRectPx(x * TILE + 15, y * TILE, 1, TILE, grain);
  fillRectPx(x * TILE, y * TILE + TILE - 2, TILE, 2, "rgba(27, 23, 29, 0.20)");
}

function drawWallTile(x, y) {
  fillTile(x, y, palette.wall);
  shadeTile(x, y, palette.trim, palette.trim, palette.wallDark, palette.wallDark);
  fillRectPx(x * TILE + 4, y * TILE + 6, TILE - 8, 3, "rgba(255, 255, 255, 0.10)");
}

function drawBorderWalls() {
  for (let x = 0; x < COLS; x += 1) {
    drawWallTile(x, 0);
    drawWallTile(x, ROWS - 1);
  }

  for (let y = 1; y < ROWS - 1; y += 1) {
    drawWallTile(0, y);
    drawWallTile(COLS - 1, y);
  }
}

function drawOfficeFloors() {
  for (let y = 1; y < ROWS - 1; y += 1) {
    for (let x = 1; x < COLS - 1; x += 1) {
      if (y >= 12) {
        drawWoodTile(x, y, true);
        continue;
      }

      const mainOfficeTile = x >= 2 && x <= 25 && y >= 1 && y <= 10;
      const woodCorridor = (x >= 12 && x <= 15) || y === 5 || y === 11;
      if (mainOfficeTile && !woodCorridor) {
        drawStoneTile(x, y);
      } else {
        drawWoodTile(x, y, false);
      }
    }
  }

  for (let x = 1; x < COLS - 1; x += 1) {
    fillRectPx(x * TILE, 11 * TILE + TILE - 4, TILE, 4, palette.trimDark);
    fillRectPx(x * TILE, 12 * TILE, TILE, 2, "rgba(255, 243, 221, 0.25)");
  }
}

function drawWindow(x, y, w = 2) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px + 3, py + 3, w * TILE - 6, TILE - 6, "#7db7ff");
  fillRectPx(px + 5, py + 5, w * TILE - 10, TILE - 10, palette.monitor);
  fillRectPx(px + 3, py + 10, w * TILE - 6, 2, "#d0f3ff");
  fillRectPx(px + (w * TILE) / 2 - 1, py + 3, 2, TILE - 6, palette.trimDark);
}

function drawPlanter(x, y, size = 1) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px + 4, py + TILE - 8, size * TILE - 8, 6, palette.planter);
  fillRectPx(px + 6, py + TILE - 6, size * TILE - 12, 4, palette.plantPot);
  fillRectPx(px + 8, py + 8, size * TILE - 16, 10, palette.plantLeaf);
  fillRectPx(px + 4, py + 12, size * TILE - 8, 8, palette.plantLeafDark);
  fillRectPx(px + 10, py + 4, 4, 8, palette.plantLeaf);
}

function drawFrame(x, y, w, h, colors) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px + 3, py + 3, w * TILE - 6, h * TILE - 6, palette.frame);
  fillRectPx(px + 6, py + 6, w * TILE - 12, h * TILE - 12, colors[0]);
  fillRectPx(px + 10, py + 10, w * TILE - 20, 6, colors[1]);
  fillRectPx(px + 12, py + 16, 10, 6, colors[2]);
}

function drawClock(x, y) {
  const px = x * TILE + 7;
  const py = y * TILE + 5;
  fillRectPx(px, py, 10, 10, "#f4f1eb");
  fillRectPx(px + 2, py + 2, 6, 6, "#ffffff");
  fillRectPx(px + 4, py + 1, 2, 4, palette.outline);
  fillRectPx(px + 5, py + 5, 3, 2, palette.outline);
}

function drawCoffeeMachine(x, y) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px + 4, py + 4, TILE - 8, TILE - 6, palette.metal);
  fillRectPx(px + 6, py + 6, TILE - 12, 6, "#bac3d6");
  fillRectPx(px + 8, py + 14, TILE - 16, 5, palette.monitorDark);
  fillRectPx(px + 10, py + 18, TILE - 20, 3, palette.coffee);
}

function drawWaterCooler(x, y) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px + 7, py + 4, 10, 8, palette.water);
  fillRectPx(px + 6, py + 12, 12, 10, "#dce8f7");
  fillRectPx(px + 9, py + 14, 2, 4, "#ff7e7e");
  fillRectPx(px + 13, py + 14, 2, 4, "#69cbff");
}

function drawCabinet(x, y, w = 2, h = 2) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px + 2, py + 2, w * TILE - 4, h * TILE - 4, "#dcd8df");
  fillRectPx(px + 4, py + 4, w * TILE - 8, h * TILE - 8, "#efedf4");
  fillRectPx(px + 4, py + (h * TILE) / 2, w * TILE - 8, 2, palette.trimDark);
  fillRectPx(px + (w * TILE) / 2 - 1, py + 6, 2, h * TILE - 12, palette.trimDark);
}

function drawOfficePartition(x, y, w, h) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px, py, w * TILE, h * TILE, "#7e89a1");
  fillRectPx(px, py, w * TILE, 3, "#cbd3e3");
  fillRectPx(px, py + h * TILE - 3, w * TILE, 3, "#596476");
}

function drawPrinterStation(x, y) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px + 2, py + 4, TILE + 20, TILE - 8, "#a9b0c1");
  fillRectPx(px + 4, py + 6, TILE + 16, TILE - 12, "#d8dce6");
  fillRectPx(px + 8, py + 9, TILE + 8, 7, "#eff2f9");
  fillRectPx(px + 10, py + 19, TILE + 4, 3, "#697186");
}

function drawStorageBay() {
  fillRectPx(11 * TILE, 2 * TILE, 6 * TILE, 2 * TILE, "#72687a");
  fillRectPx(11 * TILE, 2 * TILE, 6 * TILE, 4, palette.trim);
  fillRectPx(11 * TILE, 4 * TILE - 4, 6 * TILE, 4, "#50465a");

  for (let x = 11; x <= 16; x += 1) {
    fillRectPx(x * TILE + TILE / 2 - 1, 2 * TILE + 4, 2, 2 * TILE - 8, "#40414f");
  }

  const hangingX = [12, 13, 15];
  hangingX.forEach((x, index) => {
    fillRectPx(x * TILE + 7, 2 * TILE + 8, 10, 11, ["#2d3f59", "#4c5069", "#354b47"][index]);
    fillRectPx(x * TILE + 9, 3 * TILE + 15, 6, 4, "#2b2430");
  });

  fillRectPx(13 * TILE + 4, 2 * TILE - 8, 16, 10, "#b99877");
  fillRectPx(14 * TILE + 16, 2 * TILE - 6, 12, 8, "#ccb398");
}

function drawDoor(x, y) {
  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px + 2, py + 2, TILE + 20, TILE + 20, "#b98564");
  fillRectPx(px + 5, py + 5, TILE + 14, TILE + 14, "#d4a57a");
  fillRectPx(px + 10, py + 9, TILE + 4, TILE + 6, "#bc8b66");
  fillRectPx(px + TILE + 8, py + TILE - 2, 3, 3, palette.outline);
}

function drawResearchPads() {
  const pads = [
    { x: 2, y: 1, w: 9, h: 10 },
    { x: 17, y: 1, w: 9, h: 10 },
  ];

  pads.forEach((pad) => {
    fillRectPx(pad.x * TILE, pad.y * TILE, pad.w * TILE, pad.h * TILE, "rgba(255,255,255,0.02)");
    fillRectPx(pad.x * TILE, pad.y * TILE, pad.w * TILE, 3, "rgba(255,255,255,0.10)");
    fillRectPx(pad.x * TILE, (pad.y + pad.h) * TILE - 3, pad.w * TILE, 3, "rgba(32,24,25,0.18)");
  });
}

function drawDeskPod(desk) {
  const px = desk.x * TILE - 6;
  const py = desk.y * TILE - 6;
  const width = desk.w * TILE + 12;
  const height = desk.h * TILE + TILE + 10;

  fillRectPx(px, py, width, height, "rgba(93, 109, 136, 0.18)");
  fillRectPx(px, py, width, 4, "#c7d4e6");
  fillRectPx(px, py, 4, height - 12, "#94a1b9");
  fillRectPx(px + width - 4, py, 4, height - 12, "#94a1b9");
  fillRectPx(px + 4, py + 6, width - 8, 6, "rgba(255,255,255,0.18)");
  fillRectPx(px + 10, py + 16, width - 20, 2, "#6f7b90");
}

function drawDesk(desk, agent) {
  const px = desk.x * TILE;
  const py = desk.y * TILE;
  const width = desk.w * TILE;
  const height = desk.h * TILE;

  drawDeskPod(desk);
  fillRectPx(px + 2, py + 2, width - 4, height - 4, palette.deskTop);
  fillRectPx(px + 2, py + TILE, width - 4, height - TILE - 2, palette.deskFront);
  fillRectPx(px + 4, py + 4, width - 8, 4, "#faf4ed");
  fillRectPx(px + 2, py + height - 6, width - 4, 4, palette.deskShadow);
  fillRectPx(px + width / 2 - 1, py + 10, 2, height - 10, palette.metal);

  fillRectPx(px + 24, py + 8, 18, 12, palette.monitorDark);
  fillRectPx(px + 26, py + 10, 14, 8, palette.monitor);
  fillRectPx(px + 28, py + 20, 10, 3, palette.metal);
  fillRectPx(px + 20, py + 26, 16, 3, "#c9c4bc");
  fillRectPx(px + 8, py + 26, 10, 7, palette.paper);
  fillRectPx(px + 10, py + 28, 6, 1, palette.paperLine);
  fillRectPx(px + 44, py + 24, 6, 8, palette.mug);
  fillRectPx(px + 47, py + 22, 2, 2, palette.mug);

  drawDeskChair(desk.seat, agent.chairColor);
}

function drawDeskChair(seat, color) {
  const px = seat.x * TILE + 4;
  const py = seat.y * TILE + 4;
  fillRectPx(px + 2, py, TILE - 12, 5, palette.outline);
  fillRectPx(px + 3, py + 1, TILE - 14, 3, color);
  fillRectPx(px, py + 6, TILE - 8, TILE - 12, palette.shadow);
  fillRectPx(px + 2, py + 8, TILE - 12, TILE - 16, color);
  fillRectPx(px + 4, py + TILE - 10, 2, 5, palette.outline);
  fillRectPx(px + TILE - 10, py + TILE - 10, 2, 5, palette.outline);
}

function drawConferenceChair(seat, color) {
  const px = seat.x * TILE;
  const py = seat.y * TILE;
  const seatX = px + 4;
  const seatY = py + 7;

  fillRectPx(seatX, seatY, TILE - 8, TILE - 12, palette.shadow);
  fillRectPx(seatX + 1, seatY + 1, TILE - 10, TILE - 14, color);

  if (seat.facing === "south") {
    fillRectPx(seatX + 1, py + 2, TILE - 10, 5, palette.outline);
    fillRectPx(seatX + 2, py + 3, TILE - 12, 3, color);
  } else if (seat.facing === "north") {
    fillRectPx(seatX + 1, py + TILE - 7, TILE - 10, 5, palette.outline);
    fillRectPx(seatX + 2, py + TILE - 6, TILE - 12, 3, color);
  } else if (seat.facing === "east") {
    fillRectPx(px + TILE - 7, seatY + 1, 5, TILE - 14, palette.outline);
    fillRectPx(px + TILE - 6, seatY + 2, 3, TILE - 16, color);
  } else {
    fillRectPx(px + 2, seatY + 1, 5, TILE - 14, palette.outline);
    fillRectPx(px + 3, seatY + 2, 3, TILE - 16, color);
  }

  fillRectPx(seatX + 2, py + TILE - 4, 2, 3, palette.outline);
  fillRectPx(seatX + TILE - 14, py + TILE - 4, 2, 3, palette.outline);
}

function drawRoundedVerticalTable() {
  const px = table.x * TILE;
  const py = table.y * TILE;
  const width = table.w * TILE;
  const height = table.h * TILE;

  fillRectPx(px + 8, py, width - 16, height, palette.tableDark);
  fillRectPx(px, py + 8, width, height - 16, palette.tableDark);

  fillRectPx(px + 10, py + 2, width - 20, height - 4, palette.table);
  fillRectPx(px + 2, py + 10, width - 4, height - 20, palette.table);
  fillRectPx(px + 16, py + 8, width - 32, height - 16, palette.tableHighlight);

  const papers = [
    { x: px + 22, y: py + 20 },
    { x: px + width - 36, y: py + 24 },
    { x: px + 22, y: py + 48 },
    { x: px + width - 36, y: py + 52 },
    { x: px + width / 2 - 8, y: py + height - 22 },
  ];

  papers.forEach((paper) => {
    fillRectPx(paper.x, paper.y, 14, 10, palette.paper);
    fillRectPx(paper.x + 3, paper.y + 3, 8, 1, palette.paperLine);
    fillRectPx(paper.x + 3, paper.y + 6, 6, 1, palette.paperLine);
  });

  fillRectPx(px + width / 2 - 3, py + height / 2 - 3, 6, 6, "#9b6c4b");
}

function drawConferenceDecor() {
  drawFrame(2, 13, 2, 2, [palette.frameArtA, "#89f0ff", "#6bb17f"]);
  drawFrame(24, 13, 2, 2, [palette.frameArtC, "#ffd27f", "#d25d55"]);
  drawFrame(9, 1, 2, 2, [palette.frameArtA, "#b9f0ff", "#70a96f"]);
  drawFrame(18, 1, 2, 2, [palette.frameArtB, "#8ce6c5", "#5981c6"]);
  drawClock(13, 1);
  drawCoffeeMachine(19, 1);
  drawPlanter(2, 16, 1);
  drawPlanter(24, 16, 1);
}

function drawResearchProps() {
  drawCabinet(1, 4, 2, 3);
  drawCabinet(1, 8, 2, 2);
  drawStorageBay();
  drawPrinterStation(11, 6);
  drawPrinterStation(14, 6);
  drawDoor(24, 2);
  drawPlanter(22, 2, 1);
  drawWaterCooler(25, 5);
}

function drawOfficePartitions() {
  drawOfficePartition(1, 5, 11, 1);
  drawOfficePartition(16, 5, 11, 1);
  drawOfficePartition(5, 1, 1, 11);
  drawOfficePartition(22, 1, 1, 11);
}

function drawTopWindows() {
  for (let x = 3; x <= 22; x += 5) {
    drawWindow(x, 0, 2);
  }
}

function drawFloor() {
  fillRectPx(0, 0, canvas.width, canvas.height, palette.bg);
  drawOfficeFloors();
  drawBorderWalls();
  drawResearchPads();
  drawOfficePartitions();
  drawTopWindows();
  drawConferenceDecor();
  drawResearchProps();
}

function drawHair(agent, px, py) {
  const hair = agent.hair;
  switch (agent.hairStyle) {
    case "swept":
      fillRectPx(px + 3, py + 0, 10, 4, hair);
      fillRectPx(px + 2, py + 2, 8, 4, hair);
      fillRectPx(px + 10, py + 3, 4, 4, hair);
      break;
    case "waves":
      fillRectPx(px + 2, py + 0, 11, 4, hair);
      fillRectPx(px + 1, py + 3, 12, 4, hair);
      fillRectPx(px + 2, py + 6, 10, 2, hair);
      break;
    case "afro":
      fillRectPx(px + 1, py + 0, 13, 7, hair);
      fillRectPx(px + 3, py + 6, 9, 2, hair);
      break;
    case "bob":
      fillRectPx(px + 2, py + 0, 12, 4, hair);
      fillRectPx(px + 1, py + 3, 12, 5, hair);
      fillRectPx(px + 3, py + 8, 8, 2, hair);
      break;
    case "silver":
      fillRectPx(px + 2, py + 0, 12, 5, hair);
      fillRectPx(px + 1, py + 3, 12, 3, hair);
      fillRectPx(px + 3, py + 6, 9, 2, hair);
      break;
    case "spike":
      fillRectPx(px + 4, py + 0, 2, 3, hair);
      fillRectPx(px + 7, py + 0, 2, 4, hair);
      fillRectPx(px + 10, py + 1, 3, 3, hair);
      fillRectPx(px + 2, py + 3, 11, 4, hair);
      break;
    case "bun":
      fillRectPx(px + 6, py - 1, 4, 3, hair);
      fillRectPx(px + 2, py + 0, 11, 4, hair);
      fillRectPx(px + 1, py + 3, 12, 3, hair);
      break;
    case "crop":
      fillRectPx(px + 3, py + 1, 9, 3, hair);
      fillRectPx(px + 2, py + 3, 11, 2, hair);
      break;
    case "long":
      fillRectPx(px + 2, py + 0, 11, 4, hair);
      fillRectPx(px + 1, py + 3, 12, 5, hair);
      fillRectPx(px + 2, py + 8, 3, 4, hair);
      fillRectPx(px + 10, py + 8, 3, 4, hair);
      break;
    case "mop":
      fillRectPx(px + 2, py + 0, 11, 4, hair);
      fillRectPx(px + 1, py + 3, 12, 4, hair);
      fillRectPx(px + 3, py + 6, 8, 2, hair);
      break;
    default:
      fillRectPx(px + 2, py + 0, 11, 4, hair);
  }
}

function drawTorso(agent, px, py, seated) {
  const bodyY = py + 11;
  fillRectPx(px + 3, bodyY, 10, 8, palette.outline);
  fillRectPx(px + 4, bodyY + 1, 8, seated ? 7 : 6, agent.outfit);

  if (agent.topStyle === "vest") {
    fillRectPx(px + 6, bodyY + 1, 4, seated ? 7 : 6, "#f6f7fb");
    fillRectPx(px + 7, bodyY + 2, 2, 5, agent.accent);
  } else if (agent.topStyle === "jacket") {
    fillRectPx(px + 4, bodyY + 2, 8, 2, agent.accent);
    fillRectPx(px + 6, bodyY + 4, 4, 2, palette.outline);
  } else if (agent.topStyle === "blouse") {
    fillRectPx(px + 5, bodyY + 3, 6, 2, agent.accent);
  } else if (agent.topStyle === "coat") {
    fillRectPx(px + 6, bodyY + 1, 4, seated ? 7 : 6, agent.accent);
    fillRectPx(px + 5, bodyY + 5, 6, 2, "#dde4f0");
  } else if (agent.topStyle === "dress") {
    fillRectPx(px + 5, bodyY + 5, 6, 2, agent.accent);
  } else {
    fillRectPx(px + 5, bodyY + 2, 6, 2, agent.accent);
  }

  fillRectPx(px + 1, bodyY + 2, 2, 5, agent.skin);
  fillRectPx(px + 13, bodyY + 2, 2, 5, agent.skin);
}

function drawLegs(agent, px, py, stepFrame, seated) {
  if (seated) {
    fillRectPx(px + 5, py + 19, 6, 2, palette.outline);
    fillRectPx(px + 6, py + 20, 4, 2, "#232833");
    return;
  }

  const leftShift = stepFrame === 0 ? 0 : -1;
  const rightShift = stepFrame === 0 ? 0 : 1;
  fillRectPx(px + 5 + leftShift, py + 19, 3, 5, "#1f2430");
  fillRectPx(px + 8 + rightShift, py + 19, 3, 5, "#1f2430");
  fillRectPx(px + 5 + leftShift, py + 24, 3, 2, palette.outline);
  fillRectPx(px + 8 + rightShift, py + 24, 3, 2, palette.outline);
}

function drawSeatedAgent(agent, px, py) {
  const facing = agent.currentFacing ?? agent.seat.facing;

  fillRectPx(px + 4, py + 22, 8, 3, "rgba(27, 24, 33, 0.30)");

  if (facing === "south") {
    fillRectPx(px + 3, py + 4, 10, 9, palette.outline);
    fillRectPx(px + 4, py + 5, 8, 7, agent.skin);
    fillRectPx(px + 6, py + 9, 1, 1, "#3d2a28");
    fillRectPx(px + 10, py + 9, 1, 1, "#3d2a28");
    fillRectPx(px + 7, py + 11, 3, 1, "#d69076");
    drawHair(agent, px, py);
    drawTorso(agent, px, py, true);
    drawLegs(agent, px, py, 0, true);
    return;
  }

  if (facing === "north") {
    fillRectPx(px + 3, py + 4, 10, 9, palette.outline);
    fillRectPx(px + 4, py + 5, 8, 7, agent.hair);
    fillRectPx(px + 5, py + 7, 6, 2, "rgba(255,255,255,0.10)");
    fillRectPx(px + 4, py + 13, 8, 6, agent.outfit);
    fillRectPx(px + 5, py + 15, 6, 2, agent.accent);
    drawLegs(agent, px, py, 0, true);
    return;
  }

  if (facing === "east") {
    fillRectPx(px + 4, py + 5, 8, 8, palette.outline);
    fillRectPx(px + 5, py + 6, 5, 6, agent.hair);
    fillRectPx(px + 9, py + 6, 2, 6, agent.skin);
    fillRectPx(px + 10, py + 8, 1, 1, "#3d2a28");
    fillRectPx(px + 6, py + 13, 7, 6, agent.outfit);
    fillRectPx(px + 8, py + 15, 4, 2, agent.accent);
    fillRectPx(px + 5, py + 16, 2, 3, agent.skin);
    fillRectPx(px + 8, py + 19, 4, 2, "#232833");
    return;
  }

  fillRectPx(px + 4, py + 5, 8, 8, palette.outline);
  fillRectPx(px + 6, py + 6, 5, 6, agent.hair);
  fillRectPx(px + 5, py + 6, 2, 6, agent.skin);
  fillRectPx(px + 5, py + 8, 1, 1, "#3d2a28");
  fillRectPx(px + 3, py + 13, 7, 6, agent.outfit);
  fillRectPx(px + 4, py + 15, 4, 2, agent.accent);
  fillRectPx(px + 10, py + 16, 2, 3, agent.skin);
  fillRectPx(px + 4, py + 19, 4, 2, "#232833");
}

function drawAgent(agent, time) {
  const seatedAtDesk = phase === "research" && !agent.hasDeparted;
  const seatedAtConference = agent.hasArrived && phase !== "transition";
  const seated = seatedAtDesk || seatedAtConference;
  agent.currentFacing = seatedAtDesk ? "north" : seatedAtConference ? agent.seat.facing : null;
  const bob = phase === "research" ? Math.sin(time * 0.006 + agent.bounceSeed) * 1.5 : 0;
  const stepFrame = agent.hasDeparted && !agent.hasArrived ? Math.floor(time / 120) % 2 : 0;
  const seatedOffset =
    seated && agent.currentFacing
      ? {
          south: { x: 0, y: 2 },
          north: { x: 0, y: -2 },
          east: { x: 2, y: 0 },
          west: { x: -2, y: 0 },
        }[agent.currentFacing]
      : { x: 0, y: 0 };

  const px = Math.round(agent.position.x * TILE + TILE / 2 - 8 + seatedOffset.x);
  const py = Math.round(agent.position.y * TILE + TILE / 2 - (seated ? 10 : 12) + bob + seatedOffset.y);

  if (seated) {
    drawSeatedAgent(agent, px, py);
    return;
  }

  fillRectPx(px + 4, py + 24, 8, 3, "rgba(27, 24, 33, 0.36)");
  fillRectPx(px + 3, py + 4, 10, 10, palette.outline);
  fillRectPx(px + 4, py + 5, 8, 8, agent.skin);
  fillRectPx(px + 6, py + 9, 1, 1, "#3d2a28");
  fillRectPx(px + 10, py + 9, 1, 1, "#3d2a28");
  fillRectPx(px + 7, py + 11, 3, 1, "#d69076");
  drawHair(agent, px, py);
  drawTorso(agent, px, py, seated);
  drawLegs(agent, px, py, stepFrame, seated);
}

function wrapText(text, width) {
  ctx.font = "10px Courier New";
  const words = text.split(" ");
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 2);
}

function drawBubble(agent) {
  if (!agent.bubble) return;

  ctx.font = "10px Courier New";
  const lines = wrapText(agent.bubble, 96);
  const width = Math.max(...lines.map((line) => ctx.measureText(line).width), 48) + 16;
  const height = lines.length * 12 + 14;
  const centerX = agent.position.x * TILE + TILE / 2;
  const baseY = agent.position.y * TILE - 18;
  const x = clamp(centerX - width / 2, 8, canvas.width - width - 8);
  const y = clamp(baseY - height, 8, canvas.height - height - 12);

  fillRectPx(x, y, width, height, palette.bubbleBorder);
  fillRectPx(x + 2, y + 2, width - 4, height - 4, palette.bubbleFill);
  fillRectPx(x + 2, y + 2, width - 4, 4, agent.color);
  fillRectPx(centerX - 3, y + height - 1, 6, 3, palette.bubbleBorder);
  fillRectPx(centerX - 1, y + height + 2, 2, 5, palette.bubbleBorder);

  ctx.fillStyle = palette.bubbleText;
  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    ctx.fillText(line, x + 8, y + 8 + index * 11);
  });
}

function drawSceneLabels() {
  fillRectPx(TILE, TILE, 8 * TILE, 18, palette.labelBg);
  fillRectPx((COLS - 10) * TILE, TILE, 9 * TILE, 18, palette.labelBg);
  fillRectPx(TILE + 2, TILE + 2, 8 * TILE - 4, 2, "#74cfff");
  fillRectPx((COLS - 10) * TILE + 2, TILE + 2, 9 * TILE - 4, 2, "#ffcf78");

  ctx.fillStyle = palette.labelText;
  ctx.font = "10px Courier New";
  ctx.fillText("RESEARCH WING", TILE + 8, TILE + 5);
  ctx.fillText("BOARDROOM", (COLS - 10) * TILE + 8, TILE + 5);
}

function drawConference() {
  conferenceSeats.forEach((seat, index) => {
    drawConferenceChair(seat, agentSpecs[index].chairColor);
  });
  drawRoundedVerticalTable();
}

function drawViewport() {
  const camera = phase === "research" ? officeCamera : conferenceCamera;
  displayCtx.clearRect(0, 0, canvas.width, canvas.height);
  displayCtx.imageSmoothingEnabled = false;
  displayCtx.drawImage(
    sceneCanvas,
    camera.x,
    camera.y,
    camera.width,
    camera.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
}

function render(now) {
  drawFloor();
  desks.forEach((desk, index) => drawDesk(desk, agents[index]));
  drawConference();
  drawSceneLabels();

  [...agents]
    .sort((a, b) => a.position.y - b.position.y)
    .forEach((agent) => drawAgent(agent, now));

  agents.forEach(drawBubble);
  drawViewport();
}

function getSceneState() {
  return {
    coordinateSystem: "Tile grid. Origin is top-left. X increases right, Y increases downward.",
    phase,
    countdown: countdown.textContent,
    speaker: agents.find((agent) => agent.isSpeaking)?.role ?? null,
    agents: agents.map((agent) => ({
      id: agent.id,
      role: agent.role,
      status: agent.status,
      tile: {
        x: Number(agent.position.x.toFixed(2)),
        y: Number(agent.position.y.toFixed(2)),
      },
      seat: agent.seat,
      bubble: agent.bubble || null,
    })),
  };
}

window.render_game_to_text = () => JSON.stringify(getSceneState());

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / FIXED_FRAME_MS));
  const stepMs = ms / steps;
  for (let i = 0; i < steps; i += 1) {
    timelineNow += stepMs;
    update(timelineNow, stepMs / 1000);
  }
  render(timelineNow);
  return window.render_game_to_text();
};

function gameLoop(now) {
  const dt = Math.min((now - timelineNow) / 1000 || 0, 0.05);
  timelineNow = now;
  update(now, dt);
  render(now);
  requestAnimationFrame(gameLoop);
}

function replay() {
  buildWorld();
  timelineNow = performance.now();
  resetSceneState(timelineNow);
  render(timelineNow);
}

replayButton.addEventListener("click", replay);

createRoster();
buildWorld();
timelineNow = performance.now();
resetSceneState(timelineNow);
render(timelineNow);
requestAnimationFrame((now) => {
  timelineNow = now;
  gameLoop(now);
});
