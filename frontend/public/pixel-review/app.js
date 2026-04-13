const TILE = 24;
const COLS = 28;
const ROWS = 20;

const RESEARCH_DURATION_MS = 10_000;
const CONFERENCE_DURATION_MS = 12_000;
const DEBATE_STEP_MS = 1_050;
const MOVE_SPEED_TILES = 6.2;
const FIXED_FRAME_MS = 1000 / 60;

const query = new URLSearchParams(window.location.search);

const canvas = document.getElementById("war-room-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const phaseLabel = document.getElementById("phase-label");
const countdown = document.getElementById("countdown");
const phasePill = document.getElementById("phase-pill");
const miniPhase = document.getElementById("mini-phase");
const replayButton = document.getElementById("replay-button");
const audienceLabel = document.getElementById("audience-label");
const scenarioTitle = document.getElementById("scenario-title");
const promptCopy = document.getElementById("prompt-copy");
const scenarioPanelTitle = document.getElementById("scenario-panel-title");
const scenarioPanelCopy = document.getElementById("scenario-panel-copy");
const roster = document.getElementById("agent-roster");
const transcript = document.getElementById("transcript");
const verdictBox = document.getElementById("verdict-box");

function formatAudienceLabel(value) {
  const clean = String(value || "").trim();
  return clean ? `${clean} mode` : "Founder mode";
}

function formatScenarioTitle(value) {
  const clean = String(value || "").trim();
  return clean || "Business case review";
}

function formatPromptCopy(value) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "The advisory team is reviewing the case and will surface a memo after the pixel review sequence completes.";
  }
  return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean;
}

function buildScenarioCopy(audience, scenario) {
  const label = String(audience || "Founder").trim() || "Founder";
  const subject = String(scenario || "Business case review").trim() || "business case review";
  return `This ${label.toLowerCase()} briefing is pressure-testing "${subject}" while the team researches evidence in the office and then debates the call in the conference room.`;
}

const audienceModeLabel = formatAudienceLabel(query.get("audience"));
const scenarioHeading = formatScenarioTitle(query.get("scenario"));
const promptHeading = formatPromptCopy(query.get("prompt"));

document.title = `${scenarioHeading} | VentureBoard AI Pixel Review`;
if (audienceLabel) audienceLabel.textContent = audienceModeLabel;
if (scenarioTitle) scenarioTitle.textContent = scenarioHeading;
if (promptCopy) promptCopy.textContent = promptHeading;
if (scenarioPanelTitle) scenarioPanelTitle.textContent = scenarioHeading;
if (scenarioPanelCopy) {
  scenarioPanelCopy.textContent = buildScenarioCopy(query.get("audience"), scenarioHeading);
}

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
  { x: 2, y: 2, w: 4, h: 4, mirror: false, officeFacing: "west", seat: { x: 4.4, y: 4.7 } },
  { x: 7, y: 2, w: 4, h: 4, mirror: false, officeFacing: "west", seat: { x: 9.4, y: 4.7 } },
  { x: 12, y: 2, w: 4, h: 4, mirror: false, officeFacing: "west", seat: { x: 14.4, y: 4.7 } },
  { x: 18, y: 2, w: 4, h: 4, mirror: true, officeFacing: "east", seat: { x: 19.6, y: 4.7 } },
  { x: 23, y: 2, w: 4, h: 4, mirror: true, officeFacing: "east", seat: { x: 24.6, y: 4.7 } },
  { x: 2, y: 10, w: 4, h: 4, mirror: false, officeFacing: "west", seat: { x: 4.4, y: 12.7 } },
  { x: 7, y: 10, w: 4, h: 4, mirror: false, officeFacing: "west", seat: { x: 9.4, y: 12.7 } },
  { x: 12, y: 10, w: 4, h: 4, mirror: false, officeFacing: "west", seat: { x: 14.4, y: 12.7 } },
  { x: 18, y: 10, w: 4, h: 4, mirror: true, officeFacing: "east", seat: { x: 19.6, y: 12.7 } },
  { x: 23, y: 10, w: 4, h: 4, mirror: true, officeFacing: "east", seat: { x: 24.6, y: 12.7 } },
];

const table = { x: 8, y: 4, w: 12, h: 11 };

const conferenceSeats = [
  { x: 13, y: 2, facing: "south" },
  { x: 7, y: 6, facing: "east" },
  { x: 7, y: 8, facing: "east" },
  { x: 7, y: 10, facing: "east" },
  { x: 7, y: 12, facing: "east" },
  { x: 20, y: 6, facing: "west" },
  { x: 20, y: 8, facing: "west" },
  { x: 20, y: 10, facing: "west" },
  { x: 20, y: 12, facing: "west" },
  { x: 13, y: 15, facing: "north" },
];

const conferenceEntries = [
  { x: 3, y: 17 },
  { x: 5, y: 17 },
  { x: 7, y: 17 },
  { x: 9, y: 17 },
  { x: 11, y: 17 },
  { x: 15, y: 17 },
  { x: 17, y: 17 },
  { x: 19, y: 17 },
  { x: 21, y: 17 },
  { x: 23, y: 17 },
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

const researchChatPairs = [
  { members: ["sales", "marketing"], lines: ["ICP CHECK", "CHANNEL FIT"] },
  { members: ["ops", "research"], lines: ["FLOW BLOCK", "OPS LOAD"] },
  { members: ["ceo", "sales"], lines: ["WEDGE FIRST", "BUYER PAIN"] },
  { members: ["legal", "customer"], lines: ["TRUST GATE", "USER LANGUAGE"] },
];
const flippedConferenceAgents = new Set(["ops", "legal", "customer"]);

const PIXELLAB_SPRITE_SIZE = 74;
const OFFICE_OCCUPANT_SCALE = 2;
const CONFERENCE_OCCUPANT_SCALE = 1.85;
const WORKSTATION_PROP_SIZE = 100;
const UTILITY_PROP_SIZE = 84;
const PLANT_PROP_SIZE = 52;
const PARTITION_PROP_WIDTH = 72;
const PARTITION_PROP_HEIGHT = 48;
const CONFERENCE_TABLE_PROP_SIZE = 256;
const OFFICE_SPRITE_HEIGHT = 82;
const CONFERENCE_SPRITE_HEIGHT = 78;

const SPRITE_CROPS = {
  south: { sx: 22, sy: 10, sw: 24, sh: 50 },
  north: { sx: 22, sy: 10, sw: 24, sh: 50 },
  east: { sx: 25, sy: 12, sw: 18, sh: 50 },
  west: { sx: 24, sy: 12, sw: 18, sh: 50 },
};

const pixellabSpriteManifest = {
  ceo: {
    south: "./assets/agents/ceo/south.png",
    east: "./assets/agents/ceo/east.png",
    north: "./assets/agents/ceo/north.png",
    west: "./assets/agents/ceo/west.png",
  },
  sales: {
    south: "./assets/agents/sales/south.png",
    east: "./assets/agents/sales/east.png",
    north: "./assets/agents/sales/north.png",
    west: "./assets/agents/sales/west.png",
  },
  marketing: {
    south: "./assets/agents/marketing/south.png",
    east: "./assets/agents/marketing/east.png",
    north: "./assets/agents/marketing/north.png",
    west: "./assets/agents/marketing/west.png",
  },
  product: {
    south: "./assets/agents/product/south.png",
    east: "./assets/agents/product/east.png",
    north: "./assets/agents/product/north.png",
    west: "./assets/agents/product/west.png",
  },
  finance: {
    south: "./assets/agents/finance/south.png",
    east: "./assets/agents/finance/east.png",
    north: "./assets/agents/finance/north.png",
    west: "./assets/agents/finance/west.png",
  },
  ops: {
    south: "./assets/agents/operations/south.png",
    east: "./assets/agents/operations/east.png",
    north: "./assets/agents/operations/north.png",
    west: "./assets/agents/operations/west.png",
  },
  research: {
    south: "./assets/agents/research/south.png",
    east: "./assets/agents/research/east.png",
    north: "./assets/agents/research/north.png",
    west: "./assets/agents/research/west.png",
  },
  legal: {
    south: "./assets/agents/legal/south.png",
    east: "./assets/agents/legal/east.png",
    north: "./assets/agents/legal/north.png",
    west: "./assets/agents/legal/west.png",
  },
  customer: {
    south: "./assets/agents/customer/south.png",
    east: "./assets/agents/customer/east.png",
    north: "./assets/agents/customer/north.png",
    west: "./assets/agents/customer/west.png",
  },
  investor: {
    south: "./assets/agents/investor/south.png",
    east: "./assets/agents/investor/east.png",
    north: "./assets/agents/investor/north.png",
    west: "./assets/agents/investor/west.png",
  },
};

const propManifest = {
  workstation: "./assets/props/workstation.png",
  partition: "./assets/props/partition.png",
  utility: "./assets/props/utility.png",
  plant: "./assets/props/plant.png",
  conferenceTable: "./assets/props/conference-table.png",
};

const generatedOfficeManifest = {
  ceo: "./assets/generated/office/ceo.png",
  sales: "./assets/generated/office/sales.png",
  marketing: "./assets/generated/office/marketing.png",
  product: "./assets/generated/office/product.png",
  finance: "./assets/generated/office/finance.png",
  ops: "./assets/generated/office/ops.png",
  research: "./assets/generated/office/research.png",
  legal: "./assets/generated/office/legal.png",
  customer: "./assets/generated/office/customer.png",
  investor: "./assets/generated/office/investor.png",
};

const generatedConferenceManifest = {
  ceo: "./assets/generated/conference/ceo.png",
  sales: "./assets/generated/conference/sales.png",
  marketing: "./assets/generated/conference/marketing.png",
  product: "./assets/generated/conference/product.png",
  finance: "./assets/generated/conference/finance.png",
  ops: "./assets/generated/conference/ops.png",
  research: "./assets/generated/conference/research.png",
  legal: "./assets/generated/conference/legal.png",
  customer: "./assets/generated/conference/customer.png",
  investor: "./assets/generated/conference/investor.png",
};

const rosterRefs = new Map();
const transcriptItems = [];
const agents = [];
const wallBlocks = new Set();
const pixellabSprites = new Map();
const propSprites = new Map();
const officePodSprites = new Map();
const conferenceSeatSprites = new Map();

let phase = "research";
let phaseStartedAt = 0;
let currentSpeakerIndex = -1;
let nextDebateAt = 0;
let lastResearchShuffleAt = 0;
let timelineNow = 0;
let conferenceStartedAt = 0;
let researchCycle = 0;
let activeResearchPairIndex = 0;
let activeResponderIndex = -1;

function preloadPixellabSprites() {
  Object.entries(pixellabSpriteManifest).forEach(([agentId, directions]) => {
    const spriteSet = {};
    Object.entries(directions).forEach(([direction, url]) => {
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      spriteSet[direction] = image;
    });
    pixellabSprites.set(agentId, spriteSet);
  });
}

function preloadPropSprites() {
  Object.entries(propManifest).forEach(([name, url]) => {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    propSprites.set(name, image);
  });
}

function preloadSpriteMap(manifest, targetMap) {
  Object.entries(manifest).forEach(([name, url]) => {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    targetMap.set(name, image);
  });
}

function getPixellabSprite(agentId, direction) {
  const spriteSet = pixellabSprites.get(agentId);
  const image = spriteSet?.[direction];
  return image && image.complete && image.naturalWidth > 0 ? image : null;
}

function getPropSprite(name) {
  const image = propSprites.get(name);
  return image && image.complete && image.naturalWidth > 0 ? image : null;
}

function getLoadedMapSprite(targetMap, name) {
  const image = targetMap.get(name);
  return image && image.complete && image.naturalWidth > 0 ? image : null;
}

function getOfficePodSprite(agentId) {
  return getLoadedMapSprite(officePodSprites, agentId);
}

function getConferenceSeatSprite(agentId) {
  return getLoadedMapSprite(conferenceSeatSprites, agentId);
}

function getSpriteCrop(direction) {
  return SPRITE_CROPS[direction] ?? SPRITE_CROPS.south;
}

function drawPixellabCharacter(agent, direction, dx, dy, targetHeight, widthBoost = 1.25) {
  const sprite = getPixellabSprite(agent.id, direction);
  if (!sprite) return null;

  const crop = getSpriteCrop(direction);
  const targetWidth = Math.round((crop.sw * targetHeight) / crop.sh * widthBoost);
  ctx.drawImage(sprite, crop.sx, crop.sy, crop.sw, crop.sh, dx, dy, targetWidth, targetHeight);
  return { width: targetWidth, height: targetHeight };
}

function drawClippedPixellabCharacter(
  agent,
  direction,
  dx,
  dy,
  targetHeight,
  visibleHeight,
  widthBoost = 1.25,
) {
  const sprite = getPixellabSprite(agent.id, direction);
  if (!sprite) return null;

  const crop = getSpriteCrop(direction);
  const targetWidth = Math.round((crop.sw * targetHeight) / crop.sh * widthBoost);
  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, targetWidth, visibleHeight);
  ctx.clip();
  ctx.drawImage(sprite, crop.sx, crop.sy, crop.sw, crop.sh, dx, dy, targetWidth, targetHeight);
  ctx.restore();
  return { width: targetWidth, height: targetHeight };
}

function drawScaledClippedSeatedAgent(agent, facing, dx, dy, scale, clipHeight = 18) {
  agent.currentFacing = facing;
  ctx.save();
  ctx.translate(Math.round(dx), Math.round(dy));
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.rect(0, 0, 16, clipHeight);
  ctx.clip();
  drawSeatedAgent(agent, 0, 0);
  ctx.restore();
}

function drawScaledSeatedAgent(agent, facing, dx, dy, scale) {
  agent.currentFacing = facing;
  ctx.save();
  ctx.translate(Math.round(dx), Math.round(dy));
  ctx.scale(scale, scale);
  drawSeatedAgent(agent, 0, 0);
  ctx.restore();
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
      <div class="roster-avatar-shell">
        <img class="roster-avatar" src="${pixellabSpriteManifest[spec.id].south}" alt="${spec.name} sprite" />
        <span class="roster-dot" style="--dot-color:${spec.color}"></span>
      </div>
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

function buildWorld(scene = "office") {
  wallBlocks.clear();

  for (let x = 0; x < COLS; x += 1) {
    wallBlocks.add(key(x, 0));
    wallBlocks.add(key(x, ROWS - 1));
  }

  for (let y = 0; y < ROWS; y += 1) {
    wallBlocks.add(key(0, y));
    wallBlocks.add(key(COLS - 1, y));
  }

  if (scene === "conference") {
    for (let x = table.x + 1; x < table.x + table.w - 1; x += 1) {
      for (let y = table.y + 1; y < table.y + table.h - 1; y += 1) {
        wallBlocks.add(key(x, y));
      }
    }

    const decorBlocks = [
      { x: 2, y: 4, w: 2, h: 2 },
      { x: 24, y: 4, w: 2, h: 2 },
      { x: 2, y: 14, w: 2, h: 2 },
      { x: 24, y: 14, w: 2, h: 2 },
    ];

    decorBlocks.forEach((block) => {
      for (let x = block.x; x < block.x + block.w; x += 1) {
        for (let y = block.y; y < block.y + block.h; y += 1) {
          wallBlocks.add(key(x, y));
        }
      }
    });
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
      tile: { x: Math.round(start.x), y: Math.round(start.y) },
      currentFacing: desks[index].officeFacing,
      path: [],
      pathIndex: 0,
      hasDeparted: false,
      hasArrived: false,
      isSpeaking: false,
      isResponding: false,
      bubble: spec.research[0].toUpperCase(),
      status: spec.research[0],
      nextResearchIndex: 0,
      bounceSeed: index * 0.7 + 1,
      activity: "typing",
    });
  });
}

function resetSceneState(now = performance.now()) {
  createAgents();
  transcriptItems.length = 0;
  renderTranscript();
  setInitialVerdict();
  setPhase("research", "Research", "Researching");
  phaseStartedAt = now;
  conferenceStartedAt = 0;
  currentSpeakerIndex = -1;
  nextDebateAt = 0;
  lastResearchShuffleAt = now;
  researchCycle = 0;
  activeResearchPairIndex = 0;
  activeResponderIndex = -1;
  countdown.textContent = "00:15";
  buildWorld("office");
  applyResearchBeat();
  syncRoster();
}

function syncRoster() {
  for (const agent of agents) {
    const ref = rosterRefs.get(agent.id);
    if (!ref) continue;
    ref.status.textContent = agent.status;
    ref.item.style.opacity = agent.isSpeaking || agent.isResponding ? "1" : "0.86";
    ref.item.style.borderColor = agent.isSpeaking ? "#265868" : agent.isResponding ? "#7c6730" : "";
  }
}

function formatCountdown(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `00:${seconds.toString().padStart(2, "0")}`;
}

function getAgentById(id) {
  return agents.find((agent) => agent.id === id);
}

function getResearchPair() {
  return researchChatPairs[activeResearchPairIndex % researchChatPairs.length];
}

function applyResearchBeat() {
  const pair = getResearchPair();
  const pairedIds = new Set(pair.members);

  agents.forEach((agent) => {
    agent.isSpeaking = false;
    agent.isResponding = false;
    agent.activity = pairedIds.has(agent.id) ? "talking" : "typing";
    agent.bubble = "";
  });

  pair.members.forEach((id, index) => {
    const agent = getAgentById(id);
    if (agent) {
      agent.bubble = pair.lines[index];
      agent.status = `${agent.status} / Pair review`;
    }
  });

  for (let offset = 0, placed = 0; offset < agents.length && placed < 2; offset += 1) {
    const index = (researchCycle * 3 + offset * 2) % agents.length;
    const agent = agents[index];
    if (!agent || pairedIds.has(agent.id) || agent.bubble) continue;
    agent.bubble = agent.status.toUpperCase();
    placed += 1;
  }
}

function getDebateResponderIndex(speakerIndex) {
  if (speakerIndex === 0) return 9;
  if (speakerIndex === 9) return 0;
  if (speakerIndex >= 1 && speakerIndex <= 4) return speakerIndex + 4;
  if (speakerIndex >= 5 && speakerIndex <= 8) return speakerIndex - 4;
  return 0;
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
  setPhase("transition", "Conference Arrival", "Entering");
  phaseStartedAt = now;
  conferenceStartedAt = now;
  buildWorld("conference");

  for (const [index, agent] of agents.entries()) {
    const entry = conferenceEntries[index];
    agent.position = { x: entry.x, y: entry.y };
    agent.tile = { x: entry.x, y: entry.y };
    agent.status = "Walking to conference";
    agent.bubble = "";
    agent.isSpeaking = false;
    agent.isResponding = false;
    agent.hasDeparted = false;
    agent.hasArrived = false;
    agent.path = [];
    agent.pathIndex = 0;
    agent.currentFacing = "north";
    agent.activity = "moving";
  }

  syncRoster();
}

function startDebate(now) {
  setPhase("debate", "Debate", "Debating");
  phaseStartedAt = now;
  currentSpeakerIndex = -1;
  nextDebateAt = now + 500;
  activeResponderIndex = -1;

  for (const agent of agents) {
    agent.status = "Listening";
    agent.bubble = "";
    agent.isSpeaking = false;
    agent.isResponding = false;
  }

  syncRoster();
}

function startDelivery(now) {
  setPhase("delivery", "Verdict", "Decision Ready");
  phaseStartedAt = now;
  setFinalVerdict();
  activeResponderIndex = -1;

  for (const agent of agents) {
    agent.isSpeaking = false;
    agent.isResponding = false;
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
    agent.isResponding = false;
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
  activeResponderIndex = getDebateResponderIndex(currentSpeakerIndex);
  if (agents[activeResponderIndex] && activeResponderIndex !== currentSpeakerIndex) {
    agents[activeResponderIndex].isResponding = true;
    agents[activeResponderIndex].status = "Preparing counterpoint";
    agents[activeResponderIndex].bubble = "...";
  }
  pushTranscript(speaker.role, speaker.debate);
  syncRoster();
  nextDebateAt = now + DEBATE_STEP_MS;
}

function updateResearch(now) {
  const remaining = RESEARCH_DURATION_MS - (now - phaseStartedAt);
  countdown.textContent = formatCountdown(remaining);

  if (now - lastResearchShuffleAt > 1_900) {
    lastResearchShuffleAt = now;
    researchCycle += 1;
    activeResearchPairIndex = researchCycle % researchChatPairs.length;

    for (const agent of agents) {
      agent.nextResearchIndex = (agent.nextResearchIndex + 1) % agent.research.length;
      agent.status = agent.research[agent.nextResearchIndex];
    }

    applyResearchBeat();
    syncRoster();
  }

  if (remaining <= 0) {
    startTransition(now);
  }
}

function updateTransition(now, dt) {
  const remaining = CONFERENCE_DURATION_MS - (now - conferenceStartedAt);
  countdown.textContent = formatCountdown(remaining);
  let arrivedCount = 0;

  agents.forEach((agent, index) => {
    if (!agent.hasDeparted && now - phaseStartedAt >= index * 90) {
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

  if (Math.abs(dx) > Math.abs(dy)) {
    agent.currentFacing = dx >= 0 ? "east" : "west";
  } else if (Math.abs(dy) > 0.001) {
    agent.currentFacing = dy >= 0 ? "south" : "north";
  }

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
  } else if (phase === "debate") {
    const remaining = CONFERENCE_DURATION_MS - (now - conferenceStartedAt);
    countdown.textContent = formatCountdown(remaining);
    if (now >= nextDebateAt) {
      advanceDebate(now);
    }
  } else if (phase === "delivery") {
    const remaining = CONFERENCE_DURATION_MS - (now - conferenceStartedAt);
    countdown.textContent = formatCountdown(remaining);
  }

  if (
    conferenceStartedAt &&
    phase !== "research" &&
    phase !== "delivery" &&
    CONFERENCE_DURATION_MS - (now - conferenceStartedAt) <= 0
  ) {
    startDelivery(now);
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
  fillRectPx(x * TILE + 4, y * TILE + 4, 5, 1, "rgba(255,255,255,0.28)");
  fillRectPx(x * TILE + 8, y * TILE + 9, 8, 2, "rgba(97, 108, 135, 0.28)");
  fillRectPx(x * TILE + 18, y * TILE + 16, 3, 1, "rgba(77, 87, 109, 0.24)");
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
  fillRectPx(x * TILE, y * TILE, TILE, 1, "rgba(255, 245, 230, 0.14)");
  fillRectPx(x * TILE + 5, y * TILE, 2, TILE, grain);
  fillRectPx(x * TILE + 15, y * TILE, 1, TILE, grain);
  fillRectPx(x * TILE + 10, y * TILE + 7, 1, 10, "rgba(255,255,255,0.05)");
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
  fillRectPx(px + 2, py + 2, w * TILE - 4, TILE - 4, "#334354");
  fillRectPx(px + 3, py + 3, w * TILE - 6, TILE - 6, "#7db7ff");
  fillRectPx(px + 5, py + 5, w * TILE - 10, TILE - 10, palette.monitor);
  fillRectPx(px + 6, py + 6, w * TILE - 12, 2, "rgba(255,255,255,0.30)");
  fillRectPx(px + 3, py + 10, w * TILE - 6, 2, "#d0f3ff");
  fillRectPx(px + (w * TILE) / 2 - 1, py + 3, 2, TILE - 6, palette.trimDark);
  fillRectPx(px + 4, py + TILE - 3, w * TILE - 8, 2, "rgba(52, 32, 27, 0.28)");
}

function drawPlanter(x, y, size = 1) {
  const plant = getPropSprite("plant");
  if (plant) {
    const renderedSize = Math.round(PLANT_PROP_SIZE * size);
    ctx.drawImage(
      plant,
      x * TILE - Math.round(renderedSize * 0.2),
      y * TILE - Math.round(renderedSize * 0.42),
      renderedSize,
      renderedSize,
    );
    return;
  }

  const px = x * TILE;
  const py = y * TILE;
  fillRectPx(px + 4, py + TILE - 8, size * TILE - 8, 6, palette.planter);
  fillRectPx(px + 6, py + TILE - 6, size * TILE - 12, 4, palette.plantPot);
  fillRectPx(px + 8, py + 8, size * TILE - 16, 10, palette.plantLeaf);
  fillRectPx(px + 4, py + 12, size * TILE - 8, 8, palette.plantLeafDark);
  fillRectPx(px + 10, py + 4, 4, 8, palette.plantLeaf);
  fillRectPx(px + 14, py + 6, 3, 8, "#79c78a");
  fillRectPx(px + 18, py + 11, 3, 6, "#6fb97d");
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
  fillRectPx(px, py + 5, w * TILE, 2, "rgba(255,255,255,0.18)");
  fillRectPx(px, py + h * TILE - 3, w * TILE, 3, "#596476");
}

function drawPrinterStation(x, y) {
  const utility = getPropSprite("utility");
  if (utility) {
    ctx.drawImage(utility, x * TILE - 10, y * TILE - 12, UTILITY_PROP_SIZE, UTILITY_PROP_SIZE);
    return;
  }

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
    fillRectPx(pad.x * TILE, pad.y * TILE, 3, pad.h * TILE, "rgba(255,255,255,0.06)");
    fillRectPx((pad.x + pad.w) * TILE - 3, pad.y * TILE, 3, pad.h * TILE, "rgba(48, 60, 78, 0.14)");
    fillRectPx(pad.x * TILE + 8, pad.y * TILE + 8, pad.w * TILE - 16, 2, "rgba(255,255,255,0.05)");
    fillRectPx(pad.x * TILE, (pad.y + pad.h) * TILE - 3, pad.w * TILE, 3, "rgba(32,24,25,0.18)");
  });
}

function drawGlassBooth(x, y) {
  const partition = getPropSprite("partition");
  if (partition) {
    ctx.drawImage(
      partition,
      x * TILE - 10,
      y * TILE - 4,
      PARTITION_PROP_WIDTH,
      PARTITION_PROP_HEIGHT,
    );
    return;
  }

  drawOfficePartition(x, y, 2, 2);
}

function drawWorkspaceDivider(x, y, flip = false) {
  const partition = getPropSprite("partition");
  if (partition) {
    const drawWidth = 40;
    const drawHeight = 30;
    const px = Math.round(x * TILE - 20);
    const py = Math.round(y * TILE - 10);
    ctx.save();
    if (flip) {
      ctx.scale(-1, 1);
      ctx.drawImage(partition, -(px + drawWidth), py, drawWidth, drawHeight);
    } else {
      ctx.drawImage(partition, px, py, drawWidth, drawHeight);
    }
    ctx.restore();
    return;
  }

  drawOfficePartition(x, y, 1, 1);
}

function getDeskDividerPlacement(desk) {
  return {
    x: desk.mirror ? desk.x + 0.6 : desk.x + desk.w - 0.6,
    y: desk.y + 1.95,
    flip: desk.mirror,
  };
}

function drawPerDeskPartitions() {
  desks.forEach((desk) => {
    const placement = getDeskDividerPlacement(desk);
    drawWorkspaceDivider(placement.x, placement.y, placement.flip);
  });
}

function drawDeskPod(desk) {
  const px = desk.x * TILE - 6;
  const py = desk.y * TILE - 6;
  const width = desk.w * TILE + 12;
  const height = desk.h * TILE + TILE + 10;

  fillRectPx(px + 4, py + height - 4, width - 8, 4, "rgba(29, 36, 46, 0.25)");
  fillRectPx(px, py, width, height, "rgba(93, 109, 136, 0.18)");
  fillRectPx(px, py, width, 4, "#c7d4e6");
  fillRectPx(px, py, 4, height - 12, "#94a1b9");
  fillRectPx(px + width - 4, py, 4, height - 12, "#94a1b9");
  fillRectPx(px + 4, py + 6, width - 8, 6, "rgba(255,255,255,0.18)");
  fillRectPx(px + 10, py + 16, width - 20, 2, "#6f7b90");
  fillRectPx(px + 8, py + height - 14, width - 16, 3, "rgba(47, 58, 74, 0.24)");
  fillRectPx(px + width / 2 - 12, py + height - 8, 24, 4, "#516075");
}

function drawDesk(desk, agent) {
  const officePod = getOfficePodSprite(agent.id);
  if (officePod) {
    const size = 96;
    const px = desk.x * TILE;
    const py = desk.y * TILE;
    fillRectPx(px + 8, py + size - 5, size - 16, 4, "rgba(14,18,27,0.18)");
    ctx.save();
    if (desk.mirror) {
      ctx.scale(-1, 1);
      ctx.drawImage(officePod, -(px + size), py, size, size);
    } else {
      ctx.drawImage(officePod, px, py, size, size);
    }
    ctx.restore();
    return;
  }

  const workstation = getPropSprite("workstation");
  if (workstation) {
    const px = desk.x * TILE - 12;
    const py = desk.y * TILE - 14;
    fillRectPx(
      px + 10,
      py + WORKSTATION_PROP_SIZE - 8,
      WORKSTATION_PROP_SIZE - 20,
      5,
      "rgba(14,18,27,0.20)",
    );
    ctx.save();
    if (desk.mirror) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        workstation,
        -(px + WORKSTATION_PROP_SIZE),
        py,
        WORKSTATION_PROP_SIZE,
        WORKSTATION_PROP_SIZE,
      );
    } else {
      ctx.drawImage(workstation, px, py, WORKSTATION_PROP_SIZE, WORKSTATION_PROP_SIZE);
    }
    ctx.restore();
    return;
  }

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
  fillRectPx(px + 26, py + 10, 14, 2, "#d6fbff");
  fillRectPx(px + 28, py + 12, 8, 1, "rgba(255,255,255,0.35)");
  fillRectPx(px + 27, py + 14, 10, 1, "rgba(9, 29, 36, 0.55)");
  fillRectPx(px + 28, py + 16, 9, 1, "rgba(24, 53, 60, 0.48)");
  fillRectPx(px + 28, py + 20, 10, 3, palette.metal);
  fillRectPx(px + 20, py + 26, 16, 3, "#c9c4bc");
  fillRectPx(px + 21, py + 27, 14, 1, "#f6f1eb");
  fillRectPx(px + 8, py + 26, 10, 7, palette.paper);
  fillRectPx(px + 10, py + 28, 6, 1, palette.paperLine);
  fillRectPx(px + 10, py + 30, 5, 1, palette.paperLine);
  fillRectPx(px + 44, py + 24, 6, 8, palette.mug);
  fillRectPx(px + 47, py + 22, 2, 2, palette.mug);
  fillRectPx(px + 38, py + 26, 7, 2, "#5d6478");
  fillRectPx(px + 39, py + 28, 5, 1, "#9ea6ba");
  fillRectPx(px + 46, py + 29, 4, 1, "rgba(255,255,255,0.20)");
  fillRectPx(px + 25, py + 7, 20, 16, "rgba(129, 230, 255, 0.07)");

  drawDeskChair(desk.seat, agent.chairColor);
}

function drawDeskChair(seat, color) {
  const px = seat.x * TILE + 4;
  const py = seat.y * TILE + 4;
  fillRectPx(px + 2, py, TILE - 12, 5, palette.outline);
  fillRectPx(px + 3, py + 1, TILE - 14, 3, color);
  fillRectPx(px + 4, py + 1, TILE - 16, 1, "rgba(255,255,255,0.22)");
  fillRectPx(px, py + 6, TILE - 8, TILE - 12, palette.shadow);
  fillRectPx(px + 2, py + 8, TILE - 12, TILE - 16, color);
  fillRectPx(px + 3, py + 9, TILE - 14, 2, "rgba(255,255,255,0.16)");
  fillRectPx(px + 4, py + TILE - 10, 2, 5, palette.outline);
  fillRectPx(px + TILE - 10, py + TILE - 10, 2, 5, palette.outline);
}

function drawConferenceChair(seat, color) {
  const px = seat.x * TILE;
  const py = seat.y * TILE;
  const seatW = 18;
  const seatH = 14;
  const back = 8;

  if (seat.facing === "east") {
    fillRectPx(px + 1, py + 4, back, 20, palette.outline);
    fillRectPx(px + 2, py + 5, back - 2, 18, color);
    fillRectPx(px + 9, py + 7, seatW, seatH, palette.shadow);
    fillRectPx(px + 10, py + 8, seatW - 2, seatH - 2, color);
    fillRectPx(px + 11, py + 9, seatW - 6, 2, "rgba(255,255,255,0.18)");
    fillRectPx(px + 12, py + 22, 2, 4, palette.outline);
    fillRectPx(px + 23, py + 22, 2, 4, palette.outline);
    return;
  }

  if (seat.facing === "west") {
    fillRectPx(px + 21, py + 4, back, 20, palette.outline);
    fillRectPx(px + 22, py + 5, back - 2, 18, color);
    fillRectPx(px + 3, py + 7, seatW, seatH, palette.shadow);
    fillRectPx(px + 4, py + 8, seatW - 2, seatH - 2, color);
    fillRectPx(px + 5, py + 9, seatW - 6, 2, "rgba(255,255,255,0.18)");
    fillRectPx(px + 7, py + 22, 2, 4, palette.outline);
    fillRectPx(px + 18, py + 22, 2, 4, palette.outline);
    return;
  }

  if (seat.facing === "south") {
    fillRectPx(px + 3, py + 1, 20, back, palette.outline);
    fillRectPx(px + 4, py + 2, 18, back - 2, color);
    fillRectPx(px + 5, py + 10, 16, 14, palette.shadow);
    fillRectPx(px + 6, py + 11, 14, 12, color);
    fillRectPx(px + 8, py + 12, 10, 2, "rgba(255,255,255,0.18)");
    fillRectPx(px + 8, py + 24, 2, 4, palette.outline);
    fillRectPx(px + 18, py + 24, 2, 4, palette.outline);
    return;
  }

  fillRectPx(px + 3, py + 22, 20, back, palette.outline);
  fillRectPx(px + 4, py + 23, 18, back - 2, color);
  fillRectPx(px + 5, py + 6, 16, 14, palette.shadow);
  fillRectPx(px + 6, py + 7, 14, 12, color);
  fillRectPx(px + 8, py + 8, 10, 2, "rgba(255,255,255,0.18)");
  fillRectPx(px + 8, py + 20, 2, 4, palette.outline);
  fillRectPx(px + 18, py + 20, 2, 4, palette.outline);
}

function drawRoundedVerticalTable() {
  const px = table.x * TILE;
  const py = table.y * TILE;
  const width = table.w * TILE;
  const height = table.h * TILE;

  fillRectPx(px + 10, py + height - 2, width - 20, 4, "rgba(33, 22, 16, 0.30)");
  fillRectPx(px + 8, py, width - 16, height, palette.tableDark);
  fillRectPx(px, py + 8, width, height - 16, palette.tableDark);

  fillRectPx(px + 10, py + 2, width - 20, height - 4, palette.table);
  fillRectPx(px + 2, py + 10, width - 4, height - 20, palette.table);
  fillRectPx(px + 16, py + 8, width - 32, height - 16, palette.tableHighlight);
  fillRectPx(px + 14, py + 12, width - 28, 3, "rgba(255,255,255,0.16)");
  fillRectPx(px + 10, py + height / 2, width - 20, 2, "rgba(97, 55, 32, 0.14)");
  fillRectPx(px + 16, py + 22, width - 32, 2, "rgba(255,255,255,0.08)");
  fillRectPx(px + 16, py + height - 24, width - 32, 2, "rgba(74,42,24,0.12)");

  const papers = [
    { x: px + 20, y: py + 18, w: 16, h: 12 },
    { x: px + width - 38, y: py + 22, w: 16, h: 12 },
    { x: px + 22, y: py + 52, w: 16, h: 12 },
    { x: px + width - 40, y: py + 56, w: 16, h: 12 },
    { x: px + 22, y: py + 88, w: 16, h: 12 },
    { x: px + width - 40, y: py + 92, w: 16, h: 12 },
    { x: px + width / 2 - 22, y: py + 16, w: 18, h: 12 },
    { x: px + width / 2 + 6, y: py + 16, w: 18, h: 12 },
    { x: px + width / 2 - 24, y: py + height - 28, w: 18, h: 12 },
    { x: px + width / 2 + 8, y: py + height - 28, w: 18, h: 12 },
  ];

  papers.forEach((paper) => {
    fillRectPx(paper.x, paper.y, paper.w, paper.h, palette.paper);
    fillRectPx(paper.x + 3, paper.y + 3, paper.w - 6, 1, palette.paperLine);
    fillRectPx(paper.x + 3, paper.y + 6, paper.w - 8, 1, palette.paperLine);
    fillRectPx(paper.x + paper.w - 3, paper.y + 1, 1, paper.h - 2, "#385c99");
  });

  fillRectPx(px + width / 2 - 16, py + height / 2 - 34, 32, 18, "#6f7e97");
  fillRectPx(px + width / 2 - 14, py + height / 2 - 32, 28, 14, "#aab8d3");
  fillRectPx(px + width / 2 - 11, py + height / 2 - 29, 22, 2, "#e8eefb");
  fillRectPx(px + width / 2 - 8, py + height / 2 - 16, 16, 3, "#3d546f");
  fillRectPx(px + width / 2 - 6, py + height / 2 - 12, 12, 2, "#90a1bc");
  fillRectPx(px + 46, py + 24, 10, 3, "#dca679");
  fillRectPx(px + width - 56, py + 28, 10, 3, "#dca679");

  fillRectPx(px + width / 2 - 3, py + height / 2 - 3, 6, 6, "#9b6c4b");
  fillRectPx(px + width / 2 - 6, py + height / 2 - 10, 12, 4, "#6a7d8a");
  fillRectPx(px + width / 2 - 2, py + height / 2 - 8, 4, 8, "#9cb6c6");
  fillRectPx(px + 20, py + height - 4, 4, 7, "rgba(61,36,24,0.24)");
  fillRectPx(px + width - 24, py + height - 4, 4, 7, "rgba(61,36,24,0.24)");
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
  drawPrinterStation(10, 1);
  drawDoor(24, 2);
  drawPlanter(22, 2, 1);
  drawWaterCooler(25, 5);
}

function drawOfficePartitions() {
  drawOfficePartition(1, 5, 11, 1);
  drawOfficePartition(16, 5, 11, 1);
  drawOfficePartition(5, 1, 1, 11);
  drawOfficePartition(22, 1, 1, 11);
  drawGlassBooth(5, 4);
  drawGlassBooth(21, 4);
  drawGlassBooth(11, 8);
  drawGlassBooth(14, 8);
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

function drawAmbientLight() {
  const shafts = [3, 8, 13, 18, 23];
  shafts.forEach((x) => {
    fillRectPx(x * TILE + 6, TILE, 18, 10 * TILE, "rgba(124, 203, 255, 0.045)");
    fillRectPx(x * TILE + 10, TILE + 8, 10, 10 * TILE - 8, "rgba(255,255,255,0.035)");
  });

  fillRectPx(9 * TILE, 12 * TILE, 10 * TILE, 7 * TILE, "rgba(255, 209, 158, 0.035)");
  fillRectPx(2 * TILE, 2 * TILE, 24 * TILE, 8 * TILE, "rgba(255,255,255,0.018)");
  fillRectPx(8 * TILE, 11 * TILE, 12 * TILE, 8 * TILE, "rgba(255, 196, 132, 0.03)");
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

  fillRectPx(px + 4, py + 2, 3, 1, "rgba(255,255,255,0.18)");
  fillRectPx(px + 8, py + 3, 2, 1, "rgba(255,255,255,0.12)");
}

function drawTorso(agent, px, py, seated) {
  const bodyY = py + 11;
  fillRectPx(px + 3, bodyY, 10, 8, palette.outline);
  fillRectPx(px + 4, bodyY + 1, 8, seated ? 7 : 6, agent.outfit);
  fillRectPx(px + 5, bodyY + 1, 6, 1, "rgba(255,255,255,0.14)");

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

  fillRectPx(px + 4, bodyY + 7, 8, 1, "rgba(37,42,53,0.22)");
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

function drawWalkingSprite(agent, px, py) {
  const direction = agent.currentFacing ?? "south";
  const crop = getSpriteCrop(direction);
  const drawWidth = Math.round(((crop.sw * PIXELLAB_SPRITE_SIZE) / crop.sh) * 1.3);
  const drawX = Math.round(px + 8 - drawWidth / 2);
  const drawY = Math.round(py - 2);

  fillRectPx(drawX + 6, drawY + PIXELLAB_SPRITE_SIZE - 5, Math.max(16, drawWidth - 12), 3, "rgba(27, 24, 33, 0.30)");
  return Boolean(drawPixellabCharacter(agent, direction, drawX, drawY, PIXELLAB_SPRITE_SIZE, 1.3));
}

function drawAgent(agent, time) {
  const seatedAtConference = agent.hasArrived && phase !== "transition";
  const seated = seatedAtConference;
  if (seatedAtConference) {
    agent.currentFacing = agent.seat.facing;
  }
  const bob = phase === "transition" ? 0 : Math.sin(time * 0.004 + agent.bounceSeed) * 1.1;
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
    const direction = agent.currentFacing;
    const seatPx = agent.seat.x * TILE;
    const seatPy = agent.seat.y * TILE;
    const drawX =
      direction === "east"
        ? seatPx + 8
        : direction === "west"
          ? seatPx - 14
          : seatPx - 4;
    const drawY =
      direction === "south"
        ? seatPy + 8
        : direction === "north"
          ? seatPy - 4
          : seatPy + 1;

    drawScaledSeatedAgent(agent, direction, drawX, drawY, CONFERENCE_OCCUPANT_SCALE);
    return;
  }

  if (drawWalkingSprite(agent, px, py)) return;

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
  const desk = phase === "research" ? agent.desk : null;
  const centerX = desk
    ? Math.round((desk.x + desk.w / 2) * TILE)
    : agent.position.x * TILE + TILE / 2;
  const baseY = desk ? desk.y * TILE + 10 : agent.position.y * TILE - 18;
  const facing = phase === "research" ? agent.desk?.officeFacing : agent.seat?.facing;
  let x = clamp(centerX - width / 2, 8, canvas.width - width - 8);
  let y = clamp(baseY - height, 8, canvas.height - height - 12);
  let tailX = centerX - 1;

  if (phase === "research" && desk) {
    const laneOffset = desk.mirror ? 18 : -18;
    x = clamp(centerX - width / 2 + laneOffset, 8, canvas.width - width - 8);
    y = clamp(baseY - height - 10, 8, canvas.height - height - 12);
    tailX = desk.mirror ? x + 12 : x + width - 12;
  } else if (facing === "east") {
    x = clamp(centerX - width - 24, 8, canvas.width - width - 8);
    y = clamp(y - 6, 8, canvas.height - height - 12);
    tailX = x + width - 12;
  } else if (facing === "west") {
    x = clamp(centerX + 18, 8, canvas.width - width - 8);
    y = clamp(y - 6, 8, canvas.height - height - 12);
    tailX = x + 10;
  } else if (facing === "south") {
    y = clamp(y - 10, 8, canvas.height - height - 12);
  } else if (facing === "north") {
    y = clamp(y - 12, 8, canvas.height - height - 12);
  }

  fillRectPx(x + 3, y + 3, width, height, "rgba(10, 15, 24, 0.26)");
  fillRectPx(x, y, width, height, palette.bubbleBorder);
  fillRectPx(x + 2, y + 2, width - 4, height - 4, palette.bubbleFill);
  fillRectPx(x + 2, y + 2, width - 4, 4, agent.color);
  fillRectPx(x + 6, y + 7, width - 12, 1, "rgba(255,255,255,0.10)");
  fillRectPx(tailX - 2, y + height - 1, 6, 3, palette.bubbleBorder);
  fillRectPx(tailX, y + height + 2, 2, 5, palette.bubbleBorder);

  ctx.fillStyle = palette.bubbleText;
  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    ctx.fillText(line, x + 8, y + 8 + index * 11);
  });
}

function drawSceneLabels() {
  const title = phase === "research" ? "RESEARCH WING" : "BOARDROOM";
  const accent = phase === "research" ? "#74cfff" : "#ffcf78";

  fillRectPx(TILE, TILE, 10 * TILE, 18, palette.labelBg);
  fillRectPx(TILE + 2, TILE + 2, 10 * TILE - 4, 2, accent);
  ctx.fillStyle = palette.labelText;
  ctx.font = "10px Courier New";
  ctx.fillText(title, TILE + 8, TILE + 5);
}

function drawOfficeOccupant(agent) {
  if (getOfficePodSprite(agent.id)) return;
  const desk = agent.desk;
  const facing = desk.officeFacing;
  const seatPx = desk.seat.x * TILE;
  const seatPy = desk.seat.y * TILE;
  const drawX = facing === "east" ? seatPx - 12 : seatPx - 20;
  const drawY = seatPy - 24;
  drawScaledSeatedAgent(agent, facing, drawX, drawY, OFFICE_OCCUPANT_SCALE);
}

function drawConferenceTableProp() {
  drawRoundedVerticalTable();
}

function drawOfficeTypingPulse(agent, now) {
  const desk = agent.desk;
  const baseX = desk.x * TILE;
  const baseY = desk.y * TILE;
  const flicker = 1 + ((Math.floor(now / 140 + agent.bounceSeed * 3) % 3) * 2);
  const monitorX = desk.mirror ? baseX + 58 : baseX + 18;
  const keyboardX = desk.mirror ? baseX + 42 : baseX + 30;

  fillRectPx(monitorX, baseY + 16, 12, 2, "rgba(129,230,255,0.18)");
  fillRectPx(monitorX + 2, baseY + 20, 8, 1, "rgba(255,255,255,0.20)");
  fillRectPx(keyboardX, baseY + 44, flicker + 4, 2, "#f7d68d");
  fillRectPx(keyboardX + 10, baseY + 44, flicker, 2, "#f3f5fc");
}

function drawOfficeTalkCue(now) {
  const pair = getResearchPair();
  const [leftId, rightId] = pair.members;
  const leftAgent = getAgentById(leftId);
  const rightAgent = getAgentById(rightId);
  if (!leftAgent || !rightAgent) return;

  const leftDesk = leftAgent.desk;
  const rightDesk = rightAgent.desk;
  const dotsY = leftDesk.y * TILE + 56;
  const dotsX = Math.round(((leftDesk.x + rightDesk.x + rightDesk.w) * TILE) / 2) - 10;
  const pulse = Math.floor((Math.sin(now * 0.012) + 1) * 2);

  fillRectPx(dotsX, dotsY, 5, 5, "#fff3d5");
  fillRectPx(dotsX + 9, dotsY - pulse, 5, 5, "#fff3d5");
  fillRectPx(dotsX + 18, dotsY, 5, 5, "#fff3d5");
  fillRectPx(dotsX + 1, dotsY + 1, 3, 3, "#41313b");
  fillRectPx(dotsX + 10, dotsY + 1 - pulse, 3, 3, "#41313b");
  fillRectPx(dotsX + 19, dotsY + 1, 3, 3, "#41313b");
}

function drawOfficeActivity(now) {
  agents.forEach((agent) => {
    if (agent.activity === "typing") {
      drawOfficeTypingPulse(agent, now);
    }
  });

  drawOfficeTalkCue(now);
}

function drawDebateCue(agent, seat, now, drawX, drawY, width, height) {
  if (!agent.isSpeaking && !agent.isResponding) return;

  const pulse = Math.floor((Math.sin(now * 0.012 + agent.bounceSeed) + 1) * 2);
  const cueColor = agent.isSpeaking ? "#7ddfff" : "#ffd27f";
  const barWidth = Math.max(8, Math.round(width * 0.24));
  const barHeight = agent.isSpeaking ? 3 : 2;
  const shadowWidth = Math.max(20, width - 24);

  fillRectPx(drawX + 10, drawY + height - 6, shadowWidth, 3, "rgba(17, 21, 29, 0.24)");

  if (seat.facing === "east") {
    fillRectPx(table.x * TILE - 10 - pulse, seat.y * TILE + 10, barWidth + pulse, barHeight, cueColor);
    return;
  }

  if (seat.facing === "west") {
    fillRectPx((table.x + table.w) * TILE - barWidth + pulse, seat.y * TILE + 10, barWidth + pulse, barHeight, cueColor);
    return;
  }

  if (seat.facing === "south") {
    fillRectPx(table.x * TILE + table.w * TILE / 2 - 12, table.y * TILE - 8 - pulse, 24, barHeight + 1, cueColor);
    return;
  }

  fillRectPx(table.x * TILE + table.w * TILE / 2 - 12, (table.y + table.h) * TILE + 4 + pulse, 24, barHeight + 1, cueColor);
}

function drawGeneratedConferenceSeat(agent, seat, now) {
  const sprite = getConferenceSeatSprite(agent.id);
  if (!sprite) return false;

  const width = Math.round(sprite.naturalWidth * 1.08);
  const height = Math.round(sprite.naturalHeight * 1.08);
  const tableLeft = table.x * TILE;
  const tableRight = (table.x + table.w) * TILE;
  const tableTop = table.y * TILE;
  const tableBottom = (table.y + table.h) * TILE;
  const focusOffset = agent.isSpeaking ? 4 : agent.isResponding ? 2 : 0;
  let drawX = 0;
  let drawY = 0;

  if (seat.facing === "east") {
    drawX = tableLeft - width + 18 + focusOffset;
    drawY = Math.round(seat.y * TILE - height / 2 + 14);
  } else if (seat.facing === "west") {
    drawX = tableRight - 18 - focusOffset;
    drawY = Math.round(seat.y * TILE - height / 2 + 14);
  } else if (seat.facing === "south") {
    drawX = Math.round(tableLeft + (table.w * TILE - width) / 2);
    drawY = tableTop - height + 18 + focusOffset;
  } else {
    drawX = Math.round(tableLeft + (table.w * TILE - width) / 2);
    drawY = tableBottom - 12 - focusOffset;
  }

  const shouldFlip = seat.facing === "west" && flippedConferenceAgents.has(agent.id);
  ctx.save();
  if (shouldFlip) {
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, -(drawX + width), drawY, width, height);
  } else {
    ctx.drawImage(sprite, drawX, drawY, width, height);
  }
  ctx.restore();
  drawDebateCue(agent, seat, now, drawX, drawY, width, height);
  return true;
}

function drawOfficeScene(now) {
  fillRectPx(0, 0, canvas.width, canvas.height, palette.bg);

  for (let y = 1; y < ROWS - 1; y += 1) {
    for (let x = 1; x < COLS - 1; x += 1) {
      const mainLane = y >= 7 && y <= 9;
      const crossLane = x >= 16 && x <= 17;
      if (mainLane || crossLane) {
        drawWoodTile(x, y, false);
      } else {
        drawStoneTile(x, y);
      }
    }
  }

  drawBorderWalls();
  drawTopWindows();
  drawStorageBay();
  drawFrame(2, 1, 2, 2, [palette.frameArtA, "#89f0ff", "#6bb17f"]);
  drawFrame(24, 1, 2, 2, [palette.frameArtC, "#ffd27f", "#d25d55"]);
  drawPrinterStation(2, 15);
  drawPrinterStation(22, 15);
  drawPlanter(2, 15, 1);
  drawPlanter(24, 15, 1);
  drawWaterCooler(25, 7);
  drawCabinet(1, 6, 2, 2);
  drawDoor(1, 8);
  drawDoor(24, 8);

  desks.forEach((desk, index) => drawDesk(desk, agents[index]));
  drawPerDeskPartitions();
  agents.forEach((agent) => drawOfficeOccupant(agent));
  drawOfficeActivity(now);
  drawSceneLabels();

  agents.forEach(drawBubble);
}

function drawConferenceScene(now) {
  fillRectPx(0, 0, canvas.width, canvas.height, palette.bg);

  for (let y = 1; y < ROWS - 1; y += 1) {
    for (let x = 1; x < COLS - 1; x += 1) {
      drawWoodTile(x, y, true);
    }
  }

  drawBorderWalls();
  drawTopWindows();
  drawFrame(3, 2, 3, 2, [palette.frameArtA, "#89f0ff", "#6bb17f"]);
  drawFrame(22, 2, 3, 2, [palette.frameArtC, "#ffd27f", "#d25d55"]);
  drawClock(13, 2);
  drawPrinterStation(2, 4);
  drawPrinterStation(22, 4);
  drawPlanter(2, 13, 1);
  drawPlanter(24, 13, 1);
  const hasGeneratedConferenceSeats = agents.every((agent) => getConferenceSeatSprite(agent.id));
  if (hasGeneratedConferenceSeats) {
    conferenceSeats.forEach((seat, index) => {
      if (seat.facing !== "north") {
        drawGeneratedConferenceSeat(agents[index], seat, now);
      }
    });
    drawConferenceTableProp();
    const bottomIndex = conferenceSeats.findIndex((seat) => seat.facing === "north");
    if (bottomIndex >= 0) {
      drawGeneratedConferenceSeat(agents[bottomIndex], conferenceSeats[bottomIndex], now);
    }
  } else {
    drawConferenceTableProp();
    conferenceSeats.forEach((seat, index) => drawConferenceChair(seat, agents[index].chairColor));
    [...agents]
      .sort((a, b) => a.position.y - b.position.y)
      .forEach((agent) => drawAgent(agent, now));
  }
  drawSceneLabels();

  agents.forEach(drawBubble);
}

function render(now) {
  if (phase === "research") {
    drawOfficeScene(now);
    return;
  }

  drawConferenceScene(now);
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

preloadPixellabSprites();
preloadPropSprites();
preloadSpriteMap(generatedOfficeManifest, officePodSprites);
preloadSpriteMap(generatedConferenceManifest, conferenceSeatSprites);
createRoster();
buildWorld();
timelineNow = performance.now();
resetSceneState(timelineNow);
render(timelineNow);
requestAnimationFrame((now) => {
  timelineNow = now;
  gameLoop(now);
});
