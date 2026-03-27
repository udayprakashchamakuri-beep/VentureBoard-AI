const REPLACEMENTS = [
  [/\bNO GO\b/g, "Do not launch yet"],
  [/\bMODIFY\b/g, "Move forward with changes"],
  [/\bGO\b/g, "Launch"],
  [/\bICP\b/g, "ideal customer"],
  [/\bCAC\b/g, "customer acquisition cost"],
  [/\bROI\b/g, "return on investment"],
  [/\bACV\b/g, "annual contract value"],
  [/\bTAM\b/g, "total market size"],
  [/\bGTM\b/g, "launch plan"],
  [/\bgo-to-market\b/gi, "launch plan"],
  [/\bunit economics\b/gi, "profitability per customer"],
  [/\bwedge\b/gi, "starting focus area"],
  [/\brunway\b/gi, "cash runway"],
  [/\bstop-loss\b/gi, "clear stop rule"],
  [/\bpipeline\b/gi, "sales pipeline"],
  [/\bpayback\b/gi, "time to earn the money back"],
  [/\bqualified leads\b/gi, "strong sales leads"],
  [/\bdesign partners\b/gi, "pilot customers"],
  [/\bcontribution margin\b/gi, "profit after direct costs"],
  [/\bprocurement\b/gi, "buying approval"],
  [/\bsegment\b/gi, "customer group"],
  [/\bboardroom\b/gi, "advisory team"],
  [/\bboard\b/gi, "team"],
];

const DECISION_LABELS = {
  GO: "Launch now",
  MODIFY: "Move forward with changes",
  "NO GO": "Do not launch yet",
};

export function toPlainText(value) {
  if (!value || typeof value !== "string") {
    return value ?? "";
  }

  return REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDecisionLabel(value) {
  return DECISION_LABELS[value] ?? toPlainText(value);
}
