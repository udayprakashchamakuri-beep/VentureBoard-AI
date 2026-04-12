import { useEffect, useMemo, useRef, useState } from "react";
import { getAudienceModeConfig } from "../audienceMode";

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 560;
const OFFICE_PHASE_MS = 10000;
const CONFERENCE_PHASE_MS = 12000;
const TOTAL_PHASE_MS = OFFICE_PHASE_MS + CONFERENCE_PHASE_MS;
const HUD_TICK_MS = 120;

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

const PIXEL_PALETTE = {
  bg: "#05070d",
  panel: "#0d111a",
  panelSoft: "#121826",
  line: "#252d40",
  text: "#f3f5fb",
  muted: "#9ba7c7",
  gold: "#ffd768",
  mint: "#59ffc1",
  cyan: "#8ad8ff",
  officeWoodA: "#ba7f4c",
  officeWoodB: "#ab7345",
  officeWoodLine: "#935e35",
  tileA: "#f3efe6",
  tileB: "#e5dfd5",
  tileLine: "#d7d0c3",
  nookBlueA: "#6c9cc2",
  nookBlueB: "#6492b7",
  boardWall: "#5e4338",
  boardWallTrim: "#3f2b25",
  boardFloorA: "#c58755",
  boardFloorB: "#b57549",
  boardFloorLine: "#96613b",
  table: "#8e5d41",
  tableEdge: "#714731",
  chairShadow: "#2a2428",
  plantPot: "#cb8350",
  plantLeaf: "#48a169",
  shelfWood: "#7e5138",
  shelfDark: "#633d2a",
  deskTop: "#e8ddd0",
  deskFront: "#9fb0c6",
  deskShadow: "#70809b",
  monitorDark: "#243440",
  monitorLight: "#89efff",
  paper: "#fbf7ed",
  paperLine: "#c0b7a8",
  outline: "#231b21",
  bubbleFill: "#fff2d5",
  bubbleText: "#291f24",
  bubbleBorder: "#433540",
  pictureBlue: "#90e8ff",
  pictureGreen: "#6bb27b",
  pictureWarm: "#f1b562",
  pictureRose: "#d55e5e",
  cabinet: "#d8d4cf",
  cabinetDark: "#a8a29b",
  vending: "#727b92",
  vendingGlass: "#81ddff",
  water: "#d9edf7",
  waterBlue: "#7fd1ea",
};

const OFFICE_LAYOUT = {
  leftWidth: 560,
  pantryHeight: 196,
  nookHeight: 364,
};

const OFFICE_BEATS = [
  { agent: "Market Research Agent", message: "Checking local demand" },
  { agent: "Marketing Agent", message: "Reading audience pull" },
  { agent: "Sales Strategy Agent", message: "Testing buyer urgency" },
  { agent: "Finance Agent", message: "Checking payback pressure" },
  { agent: "Risk Agent", message: "Mapping failure points" },
  { agent: "CEO Agent", message: "Framing the board call" },
];

const CONFERENCE_BEATS = [
  { agent: "Startup Builder Agent", message: "Start with one narrow wedge" },
  { agent: "Finance Agent", message: "Hold spend behind real gates" },
  { agent: "Risk Agent", message: "Name the failure mode directly" },
  { agent: "Sales Strategy Agent", message: "Pilot with one buyer group first" },
  { agent: "CEO Agent", message: "Turn this into one board decision" },
];

const OFFICE_AGENTS = {
  "Market Research Agent": { zone: "work", path: [[126, 266], [126, 276], [126, 266]], facing: "south" },
  "Sales Strategy Agent": { zone: "work", path: [[278, 266], [278, 276], [278, 266]], facing: "south" },
  "Startup Builder Agent": { zone: "work", path: [[192, 324], [228, 324], [228, 360], [192, 360]], facing: "east" },
  "Hiring Agent": { zone: "work", path: [[126, 398], [126, 410], [126, 398]], facing: "south" },
  "Marketing Agent": { zone: "work", path: [[278, 398], [312, 398], [312, 430], [278, 430]], facing: "east" },
  "Finance Agent": { zone: "pantry", path: [[718, 116], [756, 116], [756, 150], [718, 150]], facing: "east" },
  "Pricing Agent": { zone: "pantry", path: [[832, 118], [832, 146], [802, 146], [802, 118]], facing: "south" },
  "Risk Agent": { zone: "pantry", path: [[780, 166], [820, 166], [820, 182], [780, 182]], facing: "west" },
  "CEO Agent": { zone: "nook", path: [[736, 378], [736, 404], [702, 404], [702, 378]], facing: "south" },
  "Supply Chain Agent": { zone: "nook", path: [[834, 378], [834, 404], [800, 404], [800, 378]], facing: "south" },
};

const CONFERENCE_SEATS = {
  "CEO Agent": { x: 480, y: 126, facing: "south" },
  "Market Research Agent": { x: 352, y: 206, facing: "east" },
  "Marketing Agent": { x: 352, y: 270, facing: "east" },
  "Sales Strategy Agent": { x: 352, y: 336, facing: "east" },
  "Startup Builder Agent": { x: 352, y: 404, facing: "east" },
  "Finance Agent": { x: 608, y: 206, facing: "west" },
  "Pricing Agent": { x: 608, y: 270, facing: "west" },
  "Risk Agent": { x: 608, y: 336, facing: "west" },
  "Supply Chain Agent": { x: 608, y: 404, facing: "west" },
  "Hiring Agent": { x: 480, y: 474, facing: "north" },
};

function formatSeconds(ms) {
  return `${Math.max(1, Math.ceil(ms / 1000))}s`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildPromptExcerpt(prompt) {
  const clean = String(prompt || "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "Preparing the advisory review.";
  }
  return clean.length > 138 ? `${clean.slice(0, 135)}...` : clean;
}

function getPhaseMeta(elapsedMs) {
  if (elapsedMs < OFFICE_PHASE_MS) {
    return {
      id: "office",
      label: "Office research",
      summary: "Advisors are reading signals across the office before the board debate starts.",
      beats: OFFICE_BEATS,
      localElapsed: elapsedMs,
      localDuration: OFFICE_PHASE_MS,
    };
  }
  return {
    id: "conference",
    label: "Conference debate",
    summary: "The full team is now at the table arguing the decision before the memo lands.",
    beats: CONFERENCE_BEATS,
    localElapsed: elapsedMs - OFFICE_PHASE_MS,
    localDuration: CONFERENCE_PHASE_MS,
  };
}

function getAgentVisual(agentName) {
  const specs = {
    "CEO Agent": { hair: "#403231", skin: "#efc29b", outfit: "#d8c06b", accent: "#6a5422", chair: "#d55d57" },
    "Startup Builder Agent": { hair: "#5b3d2c", skin: "#ecbb91", outfit: "#da8b55", accent: "#7f4c28", chair: "#45b7ac" },
    "Market Research Agent": { hair: "#31272d", skin: "#e9bb98", outfit: "#6fa8d8", accent: "#294768", chair: "#c2618c" },
    "Finance Agent": { hair: "#262025", skin: "#edc39f", outfit: "#55c0a8", accent: "#1f615b", chair: "#8e6adc" },
    "Marketing Agent": { hair: "#775379", skin: "#edba95", outfit: "#c789df", accent: "#6d4672", chair: "#6c8dff" },
    "Pricing Agent": { hair: "#302825", skin: "#f0c59d", outfit: "#f1cb71", accent: "#8c6921", chair: "#4e74c8" },
    "Supply Chain Agent": { hair: "#564336", skin: "#e5b589", outfit: "#7bc4d6", accent: "#375a67", chair: "#de8c48" },
    "Hiring Agent": { hair: "#8c6d50", skin: "#edc39f", outfit: "#efabc0", accent: "#7d4f60", chair: "#6ab85a" },
    "Risk Agent": { hair: "#2a2227", skin: "#e9b38d", outfit: "#d07b7b", accent: "#703333", chair: "#df8b49" },
    "Sales Strategy Agent": { hair: "#73482c", skin: "#ebb98e", outfit: "#e39a58", accent: "#854f24", chair: "#4c84d0" },
  };
  return specs[agentName] ?? { hair: "#31272d", skin: "#e9bb98", outfit: "#8da5d7", accent: "#46597f", chair: "#6b8dff" };
}

function getLoopPosition(points, elapsedMs, loopMs, offsetMs = 0) {
  if (!points?.length) {
    return { x: 0, y: 0 };
  }
  if (points.length === 1) {
    return { x: points[0][0], y: points[0][1] };
  }

  const time = ((elapsedMs + offsetMs) % loopMs) / loopMs;
  const totalSegments = points.length;
  const segment = Math.floor(time * totalSegments);
  const next = (segment + 1) % totalSegments;
  const local = time * totalSegments - segment;
  const start = points[segment];
  const end = points[next];

  return {
    x: start[0] + (end[0] - start[0]) * local,
    y: start[1] + (end[1] - start[1]) * local,
  };
}

function wrapBubbleText(ctx, text, maxWidth) {
  const words = String(text || "").split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 3);
}

function fillRectPx(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawPixelBorder(ctx, x, y, w, h, fill, border) {
  fillRectPx(ctx, x, y, w, h, border);
  fillRectPx(ctx, x + 2, y + 2, w - 4, h - 4, fill);
}

function drawWoodFloor(ctx, x, y, w, h, baseA, baseB, grain) {
  const plank = 28;
  for (let row = 0; row < h; row += plank) {
    fillRectPx(ctx, x, y + row, w, plank, (Math.floor(row / plank) % 2 === 0) ? baseA : baseB);
    fillRectPx(ctx, x, y + row + plank - 3, w, 3, grain);
    for (let col = x + 18; col < x + w; col += 86) {
      fillRectPx(ctx, col, y + row, 2, plank, grain);
    }
  }
}

function drawTileFloor(ctx, x, y, w, h) {
  const tile = 32;
  for (let row = 0; row < h; row += tile) {
    for (let col = 0; col < w; col += tile) {
      const fill = ((row / tile) + (col / tile)) % 2 === 0 ? PIXEL_PALETTE.tileA : PIXEL_PALETTE.tileB;
      fillRectPx(ctx, x + col, y + row, tile, tile, fill);
      fillRectPx(ctx, x + col, y + row + tile - 2, tile, 2, PIXEL_PALETTE.tileLine);
      fillRectPx(ctx, x + col + tile - 2, y + row, 2, tile, PIXEL_PALETTE.tileLine);
    }
  }
}

function drawBlueFloor(ctx, x, y, w, h) {
  const plank = 30;
  for (let row = 0; row < h; row += plank) {
    fillRectPx(ctx, x, y + row, w, plank, (Math.floor(row / plank) % 2 === 0) ? PIXEL_PALETTE.nookBlueA : PIXEL_PALETTE.nookBlueB);
    fillRectPx(ctx, x, y + row + plank - 3, w, 3, "rgba(255,255,255,0.06)");
  }
}

function drawShelf(ctx, x, y, width = 120, height = 48) {
  drawPixelBorder(ctx, x, y, width, height, PIXEL_PALETTE.shelfWood, PIXEL_PALETTE.shelfDark);
  fillRectPx(ctx, x + 8, y + 22, width - 16, 4, PIXEL_PALETTE.shelfDark);
  fillRectPx(ctx, x + 8, y + height - 10, width - 16, 4, PIXEL_PALETTE.shelfDark);
  const bookColors = ["#f5d88e", "#9de1ff", "#f4b37a", "#f8f3da", "#dab6ff", "#9fe3a7"];
  [y + 8, y + 28].forEach((rowY, rowIndex) => {
    let cursor = x + 10;
    let colorIndex = rowIndex;
    while (cursor < x + width - 16) {
      const bookWidth = 8 + ((cursor + rowY) % 3) * 2;
      fillRectPx(ctx, cursor, rowY, bookWidth, 12, bookColors[colorIndex % bookColors.length]);
      cursor += bookWidth + 4;
      colorIndex += 1;
    }
  });
}

function drawDesk(ctx, x, y, withMonitor = true) {
  drawPixelBorder(ctx, x, y, 92, 54, PIXEL_PALETTE.deskTop, PIXEL_PALETTE.deskShadow);
  fillRectPx(ctx, x + 6, y + 26, 80, 22, PIXEL_PALETTE.deskFront);
  fillRectPx(ctx, x + 18, y + 54, 6, 14, PIXEL_PALETTE.tableEdge);
  fillRectPx(ctx, x + 68, y + 54, 6, 14, PIXEL_PALETTE.tableEdge);
  if (withMonitor) {
    fillRectPx(ctx, x + 22, y + 10, 28, 18, PIXEL_PALETTE.monitorDark);
    fillRectPx(ctx, x + 26, y + 14, 20, 10, PIXEL_PALETTE.monitorLight);
    fillRectPx(ctx, x + 32, y + 28, 8, 4, "#818c9d");
    fillRectPx(ctx, x + 24, y + 34, 24, 4, "#d7cfbf");
  }
}

function drawDeskChair(ctx, x, y, color) {
  fillRectPx(ctx, x, y, 26, 22, PIXEL_PALETTE.chairShadow);
  fillRectPx(ctx, x + 2, y + 2, 22, 18, color);
  fillRectPx(ctx, x + 5, y - 10, 16, 10, PIXEL_PALETTE.outline);
  fillRectPx(ctx, x + 7, y - 8, 12, 6, color);
  fillRectPx(ctx, x + 5, y + 22, 3, 10, PIXEL_PALETTE.outline);
  fillRectPx(ctx, x + 18, y + 22, 3, 10, PIXEL_PALETTE.outline);
}

function drawPlant(ctx, x, y, size = "regular") {
  const scale = size === "large" ? 1.35 : 1;
  drawPixelBorder(ctx, x, y + 20 * scale, 30 * scale, 22 * scale, PIXEL_PALETTE.plantPot, "#8d5736");
  fillRectPx(ctx, x + 10 * scale, y + 2 * scale, 8 * scale, 20 * scale, PIXEL_PALETTE.plantLeaf);
  fillRectPx(ctx, x + 2 * scale, y + 10 * scale, 10 * scale, 8 * scale, PIXEL_PALETTE.plantLeaf);
  fillRectPx(ctx, x + 16 * scale, y + 8 * scale, 10 * scale, 10 * scale, PIXEL_PALETTE.plantLeaf);
  fillRectPx(ctx, x + 6 * scale, y + 0, 6 * scale, 10 * scale, "#63bf82");
  fillRectPx(ctx, x + 18 * scale, y + 0, 6 * scale, 10 * scale, "#63bf82");
}

function drawWindow(ctx, x, y, width = 92, height = 50) {
  drawPixelBorder(ctx, x, y, width, height, "#9ddce0", "#547784");
  fillRectPx(ctx, x + width / 2 - 2, y + 2, 4, height - 4, "#6d939d");
  fillRectPx(ctx, x + 2, y + height / 2 - 2, width - 4, 4, "#6d939d");
}

function drawFrame(ctx, x, y, warm = false) {
  drawPixelBorder(ctx, x, y, 78, 54, warm ? "#f0b06b" : "#7cc9df", "#6a4530");
  fillRectPx(ctx, x + 8, y + 10, 62, 36, warm ? PIXEL_PALETTE.pictureWarm : PIXEL_PALETTE.pictureBlue);
  fillRectPx(ctx, x + 16, y + 24, 14, 10, PIXEL_PALETTE.pictureGreen);
  fillRectPx(ctx, x + 34, y + 16, 18, 18, warm ? PIXEL_PALETTE.pictureRose : PIXEL_PALETTE.pictureGreen);
}

function drawVending(ctx, x, y) {
  drawPixelBorder(ctx, x, y, 52, 86, PIXEL_PALETTE.vending, "#50586b");
  fillRectPx(ctx, x + 8, y + 10, 36, 46, PIXEL_PALETTE.vendingGlass);
  fillRectPx(ctx, x + 10, y + 12, 14, 14, "#ff9a7e");
  fillRectPx(ctx, x + 26, y + 12, 14, 14, "#9bdbff");
  fillRectPx(ctx, x + 10, y + 30, 14, 14, "#f1e38d");
  fillRectPx(ctx, x + 26, y + 30, 14, 14, "#8df0b0");
  fillRectPx(ctx, x + 18, y + 62, 16, 10, "#394257");
}

function drawWaterCooler(ctx, x, y) {
  drawPixelBorder(ctx, x, y, 30, 62, PIXEL_PALETTE.water, "#7a8ea0");
  fillRectPx(ctx, x + 8, y - 10, 14, 18, PIXEL_PALETTE.waterBlue);
  fillRectPx(ctx, x + 10, y + 16, 10, 22, "#d6eff6");
  fillRectPx(ctx, x + 10, y + 42, 10, 10, "#848fa3");
}

function drawCabinet(ctx, x, y) {
  drawPixelBorder(ctx, x, y, 46, 86, PIXEL_PALETTE.cabinet, PIXEL_PALETTE.cabinetDark);
  fillRectPx(ctx, x + 8, y + 18, 30, 3, PIXEL_PALETTE.cabinetDark);
  fillRectPx(ctx, x + 8, y + 42, 30, 3, PIXEL_PALETTE.cabinetDark);
  fillRectPx(ctx, x + 8, y + 66, 30, 3, PIXEL_PALETTE.cabinetDark);
  fillRectPx(ctx, x + 18, y + 12, 10, 4, "#8f897f");
  fillRectPx(ctx, x + 18, y + 36, 10, 4, "#8f897f");
  fillRectPx(ctx, x + 18, y + 60, 10, 4, "#8f897f");
}

function drawCoffeeMachine(ctx, x, y) {
  drawPixelBorder(ctx, x, y, 60, 54, "#a5a8b6", "#60606c");
  fillRectPx(ctx, x + 10, y + 10, 18, 14, PIXEL_PALETTE.monitorLight);
  fillRectPx(ctx, x + 36, y + 14, 12, 6, "#3d495b");
  fillRectPx(ctx, x + 28, y + 28, 8, 14, "#4f5866");
  fillRectPx(ctx, x + 36, y + 30, 10, 10, "#6d4a36");
}

function drawDoor(ctx, x, y, vertical = true) {
  if (vertical) {
    drawPixelBorder(ctx, x, y, 22, 64, "#9d6b45", "#603d27");
    fillRectPx(ctx, x + 8, y + 8, 6, 48, "#f0d8a0");
    fillRectPx(ctx, x + 14, y + 32, 4, 4, "#6f4e33");
  } else {
    drawPixelBorder(ctx, x, y, 64, 22, "#9d6b45", "#603d27");
    fillRectPx(ctx, x + 8, y + 8, 48, 6, "#f0d8a0");
  }
}

function drawSideTable(ctx, x, y) {
  fillRectPx(ctx, x, y, 28, 18, PIXEL_PALETTE.table);
  fillRectPx(ctx, x + 3, y + 18, 4, 10, PIXEL_PALETTE.tableEdge);
  fillRectPx(ctx, x + 21, y + 18, 4, 10, PIXEL_PALETTE.tableEdge);
}

function drawPaperStack(ctx, x, y) {
  fillRectPx(ctx, x, y, 22, 14, PIXEL_PALETTE.paper);
  fillRectPx(ctx, x + 4, y + 4, 14, 2, PIXEL_PALETTE.paperLine);
  fillRectPx(ctx, x + 4, y + 8, 10, 2, PIXEL_PALETTE.paperLine);
}

function drawBoardroomTable(ctx, x, y, width, height) {
  fillRectPx(ctx, x + 18, y, width - 36, height, PIXEL_PALETTE.table);
  fillRectPx(ctx, x, y + 18, width, height - 36, PIXEL_PALETTE.table);
  fillRectPx(ctx, x + 6, y + 18, 18, height - 36, PIXEL_PALETTE.tableEdge);
  fillRectPx(ctx, x + width - 24, y + 18, 18, height - 36, PIXEL_PALETTE.tableEdge);
  fillRectPx(ctx, x + 18, y + 6, width - 36, 18, PIXEL_PALETTE.tableEdge);
  fillRectPx(ctx, x + 18, y + height - 24, width - 36, 18, PIXEL_PALETTE.tableEdge);
  fillRectPx(ctx, x + 56, y + height - 12, 8, 42, PIXEL_PALETTE.tableEdge);
  fillRectPx(ctx, x + width - 64, y + height - 12, 8, 42, PIXEL_PALETTE.tableEdge);
  fillRectPx(ctx, x + width / 2 - 4, y + height - 12, 8, 46, PIXEL_PALETTE.tableEdge);
}

function drawBoardChair(ctx, x, y, facing, color) {
  fillRectPx(ctx, x - 16, y - 10, 32, 20, PIXEL_PALETTE.chairShadow);
  fillRectPx(ctx, x - 14, y - 8, 28, 16, color);
  if (facing === "south") {
    fillRectPx(ctx, x - 12, y - 26, 24, 14, PIXEL_PALETTE.outline);
    fillRectPx(ctx, x - 10, y - 24, 20, 10, color);
  } else if (facing === "north") {
    fillRectPx(ctx, x - 12, y + 12, 24, 14, PIXEL_PALETTE.outline);
    fillRectPx(ctx, x - 10, y + 14, 20, 10, color);
  } else if (facing === "east") {
    fillRectPx(ctx, x + 14, y - 8, 12, 26, PIXEL_PALETTE.outline);
    fillRectPx(ctx, x + 16, y - 6, 8, 22, color);
  } else {
    fillRectPx(ctx, x - 26, y - 8, 12, 26, PIXEL_PALETTE.outline);
    fillRectPx(ctx, x - 24, y - 6, 8, 22, color);
  }
}

function drawAgentBubble(ctx, x, y, message, accent) {
  if (!message) {
    return;
  }
  ctx.font = "12px 'Courier New', monospace";
  const lines = wrapBubbleText(ctx, message.toUpperCase(), 170);
  const width = Math.max(...lines.map((line) => ctx.measureText(line).width), 96) + 18;
  const height = lines.length * 14 + 18;
  const bubbleX = clamp(x - width / 2, 14, CANVAS_WIDTH - width - 14);
  const bubbleY = clamp(y - height - 44, 12, CANVAS_HEIGHT - height - 12);

  drawPixelBorder(ctx, bubbleX, bubbleY, width, height, PIXEL_PALETTE.bubbleFill, PIXEL_PALETTE.bubbleBorder);
  fillRectPx(ctx, bubbleX + 2, bubbleY + 2, width - 4, 4, accent);
  fillRectPx(ctx, x - 3, bubbleY + height - 2, 6, 6, PIXEL_PALETTE.bubbleBorder);
  fillRectPx(ctx, x - 1, bubbleY + height + 4, 2, 8, PIXEL_PALETTE.bubbleBorder);

  ctx.fillStyle = PIXEL_PALETTE.bubbleText;
  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    ctx.fillText(line, bubbleX + 9, bubbleY + 10 + index * 14);
  });
}

function drawStandingAgent(ctx, x, y, spec, frame = 0) {
  const step = frame % 2 === 0 ? 0 : 1;
  fillRectPx(ctx, x - 10, y + 28, 20, 4, "rgba(18, 14, 18, 0.35)");
  fillRectPx(ctx, x - 8, y, 16, 12, PIXEL_PALETTE.outline);
  fillRectPx(ctx, x - 7, y + 1, 14, 10, spec.skin);
  fillRectPx(ctx, x - 8, y - 2, 16, 6, spec.hair);
  fillRectPx(ctx, x - 6, y + 5, 2, 2, PIXEL_PALETTE.outline);
  fillRectPx(ctx, x + 4, y + 5, 2, 2, PIXEL_PALETTE.outline);
  fillRectPx(ctx, x - 8, y + 12, 16, 14, PIXEL_PALETTE.outline);
  fillRectPx(ctx, x - 7, y + 13, 14, 12, spec.outfit);
  fillRectPx(ctx, x - 4, y + 14, 8, 10, spec.accent);
  fillRectPx(ctx, x - 12, y + 14, 4, 12, spec.outfit);
  fillRectPx(ctx, x + 8, y + 14, 4, 12, spec.outfit);
  fillRectPx(ctx, x - 11, y + 24, 3, 3, spec.skin);
  fillRectPx(ctx, x + 8, y + 24, 3, 3, spec.skin);
  fillRectPx(ctx, x - 7 + (step ? -1 : 0), y + 26, 4, 10, PIXEL_PALETTE.outline);
  fillRectPx(ctx, x + 3 + (step ? 1 : 0), y + 26, 4, 10, PIXEL_PALETTE.outline);
}

function drawSeatedAgent(ctx, x, y, spec, facing) {
  fillRectPx(ctx, x - 10, y + 20, 20, 4, "rgba(18, 14, 18, 0.28)");
  if (facing === "south") {
    fillRectPx(ctx, x - 8, y - 2, 16, 6, spec.hair);
    fillRectPx(ctx, x - 8, y + 2, 16, 12, PIXEL_PALETTE.outline);
    fillRectPx(ctx, x - 7, y + 3, 14, 10, spec.skin);
  } else if (facing === "north") {
    fillRectPx(ctx, x - 8, y + 8, 16, 12, PIXEL_PALETTE.outline);
    fillRectPx(ctx, x - 7, y + 9, 14, 10, spec.skin);
    fillRectPx(ctx, x - 8, y + 16, 16, 6, spec.hair);
  } else if (facing === "east") {
    fillRectPx(ctx, x - 2, y + 2, 14, 12, PIXEL_PALETTE.outline);
    fillRectPx(ctx, x - 1, y + 3, 12, 10, spec.skin);
    fillRectPx(ctx, x + 3, y, 10, 6, spec.hair);
  } else {
    fillRectPx(ctx, x - 12, y + 2, 14, 12, PIXEL_PALETTE.outline);
    fillRectPx(ctx, x - 11, y + 3, 12, 10, spec.skin);
    fillRectPx(ctx, x - 13, y, 10, 6, spec.hair);
  }
  fillRectPx(ctx, x - 8, y + 14, 16, 12, PIXEL_PALETTE.outline);
  fillRectPx(ctx, x - 7, y + 15, 14, 10, spec.outfit);
  fillRectPx(ctx, x - 3, y + 16, 6, 8, spec.accent);
}

function drawOfficeScene(ctx, elapsedMs, activeBeat) {
  const { leftWidth, pantryHeight } = OFFICE_LAYOUT;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  fillRectPx(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, PIXEL_PALETTE.bg);

  drawWoodFloor(ctx, 0, 0, leftWidth, CANVAS_HEIGHT, PIXEL_PALETTE.officeWoodA, PIXEL_PALETTE.officeWoodB, PIXEL_PALETTE.officeWoodLine);
  drawTileFloor(ctx, leftWidth, 0, CANVAS_WIDTH - leftWidth, pantryHeight);
  drawBlueFloor(ctx, leftWidth, pantryHeight, CANVAS_WIDTH - leftWidth, CANVAS_HEIGHT - pantryHeight);

  fillRectPx(ctx, 0, 0, CANVAS_WIDTH, 16, "#3d495f");
  fillRectPx(ctx, 0, CANVAS_HEIGHT - 16, CANVAS_WIDTH, 16, "#121620");
  fillRectPx(ctx, 0, 16, 20, CANVAS_HEIGHT - 32, "#151925");
  fillRectPx(ctx, CANVAS_WIDTH - 20, 16, 20, CANVAS_HEIGHT - 32, "#151925");

  fillRectPx(ctx, 48, 160, 352, 12, "rgba(255,255,255,0.08)");
  fillRectPx(ctx, 48, 160, 10, 284, "#8b6756");
  fillRectPx(ctx, 390, 160, 10, 284, "#8b6756");
  fillRectPx(ctx, 48, 432, 352, 10, "rgba(31,23,29,0.22)");
  fillRectPx(ctx, 414, 160, 10, 120, "#8b6756");
  fillRectPx(ctx, 414, 308, 10, 136, "#8b6756");
  fillRectPx(ctx, 48, 146, 376, 10, "#c9b9aa");

  fillRectPx(ctx, leftWidth - 10, 0, 10, CANVAS_HEIGHT, PIXEL_PALETTE.panel);
  fillRectPx(ctx, leftWidth, pantryHeight - 10, CANVAS_WIDTH - leftWidth, 10, PIXEL_PALETTE.panel);
  drawDoor(ctx, leftWidth - 22, 126, true);
  drawDoor(ctx, leftWidth - 22, 340, true);
  drawDoor(ctx, CANVAS_WIDTH - 34, 304, true);

  drawPixelBorder(ctx, 34, 24, 172, 76, "#eef7ff", "#5f7d8b");
  fillRectPx(ctx, 54, 42, 126, 4, "#8dcde1");
  fillRectPx(ctx, 54, 56, 92, 4, "#ddb07b");
  fillRectPx(ctx, 54, 70, 114, 4, "#9cbfd0");
  drawShelf(ctx, 166, 44, 124, 56);
  drawShelf(ctx, 324, 44, 132, 56);
  drawShelf(ctx, 430, 44, 102, 56);
  drawWindow(ctx, 304, 120, 108, 58);
  fillRectPx(ctx, 72, 112, 28, 22, "#d9b77b");
  fillRectPx(ctx, 104, 126, 28, 22, "#d9b77b");
  fillRectPx(ctx, 136, 140, 28, 22, "#d9b77b");
  drawShelf(ctx, 46, 106, 86, 44);
  drawShelf(ctx, 430, 106, 96, 44);

  drawDesk(ctx, 88, 198);
  drawDesk(ctx, 234, 198);
  drawDesk(ctx, 88, 344);
  drawDesk(ctx, 234, 344);
  drawDeskChair(ctx, 124, 250, "#b78b5a");
  drawDeskChair(ctx, 270, 250, "#b78b5a");
  drawDeskChair(ctx, 124, 396, "#b78b5a");
  drawDeskChair(ctx, 270, 396, "#b78b5a");
  drawShelf(ctx, 96, 446, 118, 50);
  drawShelf(ctx, 244, 446, 118, 50);
  drawPlant(ctx, 38, 454);
  drawPlant(ctx, 490, 452);
  drawPlant(ctx, 450, 316);
  drawSideTable(ctx, 172, 296);
  drawSideTable(ctx, 320, 296);
  drawWindow(ctx, 120, 28, 94, 50);
  drawWindow(ctx, 346, 28, 94, 50);

  drawShelf(ctx, 638, 42, 124, 54);
  drawShelf(ctx, 790, 42, 114, 54);
  drawVending(ctx, 816, 80);
  drawWaterCooler(ctx, 892, 82);
  drawCabinet(ctx, 716, 34);
  drawCabinet(ctx, 774, 34);
  drawDesk(ctx, 646, 126, false);
  drawCoffeeMachine(ctx, 858, 126);
  fillRectPx(ctx, 752, 16, 4, 4, "#23212a");
  fillRectPx(ctx, 744, 8, 20, 4, PIXEL_PALETTE.outline);
  fillRectPx(ctx, 750, 10, 2, 10, "#ffffff");
  drawPlant(ctx, 920, 126);

  drawFrame(ctx, 676, 236, false);
  drawShelf(ctx, 634, 246, 112, 52);
  drawShelf(ctx, 810, 246, 112, 52);
  drawWindow(ctx, 760, 246, 96, 54);
  drawBoardroomTable(ctx, 700, 324, 148, 76);
  drawBoardChair(ctx, 680, 360, "east", "#c95d8c");
  drawBoardChair(ctx, 870, 360, "west", "#6b8dff");
  drawSideTable(ctx, 632, 338);
  drawSideTable(ctx, 864, 338);
  drawPlant(ctx, 620, 420, "large");
  drawPlant(ctx, 904, 418, "large");

  AGENT_ORDER.forEach((agentName, index) => {
    const assignment = OFFICE_AGENTS[agentName];
    if (!assignment) {
      return;
    }
    const spec = getAgentVisual(agentName);
    const pos = getLoopPosition(assignment.path, elapsedMs, 4200 + index * 120, index * 330);
    const bob = assignment.zone === "work" ? Math.sin((elapsedMs + index * 80) / 300) * 1.2 : Math.sin((elapsedMs + index * 55) / 360) * 0.8;
    drawStandingAgent(ctx, pos.x, pos.y + bob, spec, Math.floor((elapsedMs + index * 140) / 280));
    if (activeBeat.agent === agentName) {
      drawAgentBubble(ctx, pos.x, pos.y - 8, activeBeat.message, spec.accent);
    }
  });
}

function drawConferenceScene(ctx, elapsedMs, activeBeat) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  fillRectPx(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, PIXEL_PALETTE.bg);
  fillRectPx(ctx, 0, 0, CANVAS_WIDTH, 112, PIXEL_PALETTE.boardWall);
  fillRectPx(ctx, 0, 112, CANVAS_WIDTH, CANVAS_HEIGHT - 112, "#f3efe6");
  drawWoodFloor(ctx, 0, 112, CANVAS_WIDTH, CANVAS_HEIGHT - 112, PIXEL_PALETTE.boardFloorA, PIXEL_PALETTE.boardFloorB, PIXEL_PALETTE.boardFloorLine);

  fillRectPx(ctx, 0, 0, CANVAS_WIDTH, 14, PIXEL_PALETTE.boardWallTrim);
  fillRectPx(ctx, 0, 98, CANVAS_WIDTH, 14, PIXEL_PALETTE.boardWallTrim);
  fillRectPx(ctx, 104, 0, 24, 112, "#a54f40");
  fillRectPx(ctx, 418, 0, 24, 112, "#a54f40");
  fillRectPx(ctx, 740, 0, 24, 112, "#a54f40");
  fillRectPx(ctx, 104, 0, 24, 112, "#8e3d31");
  fillRectPx(ctx, 418, 0, 24, 112, "#8e3d31");
  fillRectPx(ctx, 740, 0, 24, 112, "#8e3d31");
  drawFrame(ctx, 174, 28, false);
  fillRectPx(ctx, 478, 18, 4, 4, PIXEL_PALETTE.outline);
  fillRectPx(ctx, 468, 8, 24, 4, PIXEL_PALETTE.outline);
  fillRectPx(ctx, 474, 10, 4, 16, "#ffffff");
  drawCoffeeMachine(ctx, 620, 28);
  drawFrame(ctx, 42, 250, false);
  drawFrame(ctx, 870, 250, true);
  drawPlant(ctx, 36, 60, "large");
  drawPlant(ctx, 860, 54, "large");
  drawPlant(ctx, 38, 422, "large");
  drawPlant(ctx, 864, 422, "large");

  drawBoardroomTable(ctx, 340, 150, 280, 314);
  AGENT_ORDER.forEach((agentName) => {
    const seat = CONFERENCE_SEATS[agentName];
    const spec = getAgentVisual(agentName);
    drawBoardChair(ctx, seat.x, seat.y, seat.facing, spec.chair);
  });

  AGENT_ORDER.forEach((agentName, index) => {
    const seat = CONFERENCE_SEATS[agentName];
    const spec = getAgentVisual(agentName);
    const yBob = Math.sin((elapsedMs + index * 90) / 400) * 0.8;
    const active = activeBeat.agent === agentName;
    drawSeatedAgent(ctx, seat.x, seat.y - 12 + yBob, spec, seat.facing);
    drawPaperStack(ctx, seat.x - 12, seat.y - 38);
    if (active) {
      drawAgentBubble(ctx, seat.x, seat.y - 20, activeBeat.message, spec.accent);
    }
  });
}

function drawPixelScene(ctx, elapsedMs, activeBeat, phaseId) {
  if (phaseId === "office") {
    drawOfficeScene(ctx, elapsedMs, activeBeat);
    return;
  }
  drawConferenceScene(ctx, elapsedMs, activeBeat);
}

export default function PixelReviewSequence({
  agentMeta,
  loadingStartedAt,
  latestPrompt,
  scenarioTitle,
  audienceMode,
}) {
  const canvasRef = useRef(null);
  const [uiNow, setUiNow] = useState(() => Date.now());
  const audienceConfig = getAudienceModeConfig(audienceMode);

  useEffect(() => {
    const timer = window.setInterval(() => setUiNow(Date.now()), HUD_TICK_MS);
    return () => window.clearInterval(timer);
  }, [loadingStartedAt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    let animationFrameId = 0;
    const startedAt = loadingStartedAt ?? Date.now();

    const render = () => {
      const elapsedMs = Math.min(Date.now() - startedAt, TOTAL_PHASE_MS);
      const phaseMeta = getPhaseMeta(elapsedMs);
      const beatSpan = phaseMeta.id === "office" ? 1700 : 2200;
      const beatIndex = Math.floor(phaseMeta.localElapsed / beatSpan) % phaseMeta.beats.length;
      const activeBeat = phaseMeta.beats[beatIndex];

      drawPixelScene(ctx, phaseMeta.localElapsed, activeBeat, phaseMeta.id);
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [agentMeta, loadingStartedAt]);

  const elapsedMs = Math.min(Math.max(0, uiNow - (loadingStartedAt ?? uiNow)), TOTAL_PHASE_MS);
  const phaseMeta = getPhaseMeta(elapsedMs);
  const beatSpan = phaseMeta.id === "office" ? 1700 : 2200;
  const beatIndex = Math.floor(phaseMeta.localElapsed / beatSpan) % phaseMeta.beats.length;
  const activeBeat = phaseMeta.beats[beatIndex];
  const remainingMs = TOTAL_PHASE_MS - elapsedMs;
  const progress = Math.min(100, Math.round((elapsedMs / TOTAL_PHASE_MS) * 100));
  const promptExcerpt = useMemo(() => buildPromptExcerpt(latestPrompt), [latestPrompt]);

  return (
    <section className="pixel-review-screen" aria-label="Full-screen advisor review animation">
      <div className="pixel-review-shell">
        <div className="pixel-review-canvas-shell">
          <div className="pixel-review-overlay">
            <div className="pixel-review-kicker">
              <span>{audienceConfig.label} mode</span>
              <span className="pixel-review-divider" />
              <span>{phaseMeta.label}</span>
            </div>
            <div className="pixel-review-timer">
              <strong>{formatSeconds(remainingMs)}</strong>
              <span>until memo</span>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            className="pixel-review-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            aria-label="Pixel office and conference review"
          />
          <div className="pixel-review-status">
            <div className="pixel-review-status-copy">
              <strong>{scenarioTitle}</strong>
              <p>{promptExcerpt}</p>
            </div>
            <div className="pixel-review-progress">
              <div className="pixel-review-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
