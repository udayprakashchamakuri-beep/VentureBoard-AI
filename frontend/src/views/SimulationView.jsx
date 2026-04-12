import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeDollarSign,
  Bot,
  Crown,
  Handshake,
  Megaphone,
  Rocket,
  Search,
  ShieldAlert,
  Truck,
  Users,
} from "lucide-react";
import {
  buildAdvisorParagraph,
  buildDirectAdvisorReply,
  buildRoundSummary,
  formatAdvisorStanceLabel,
  formatDecisionLabel,
  shouldShowAdvisorStanceBadge,
  toPlainText,
} from "../plainLanguage";
import { getAudienceModeConfig } from "../audienceMode";

function getConversationMeta(agentMeta, name) {
  if (agentMeta[name]) {
    return agentMeta[name];
  }

  if (name === "General Assistant") {
    return {
      accent: "#7be7d4",
      symbol: "smart_toy",
      label: "General Assistant",
      title: "Direct model answer",
      boardRole: "Direct model answer",
    };
  }

  return {
    accent: "#9ac9ff",
    symbol: "smart_toy",
    label: String(name || "Assistant").replace(" Agent", ""),
    title: "Direct answer",
    boardRole: "Direct answer",
  };
}

function buildExpandedReasoningText(turn) {
  if (!turn) {
    return "";
  }

  const sections = [];
  const cleanMessage = toPlainText(String(turn.message ?? "").replace(/^\[[^\]]+\]:\s*/, ""));
  const researchPoints = (turn.research_points ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const keyPoints = (turn.key_points ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const assumptions = (turn.assumptions ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const calculations = (turn.calculations ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const memoryReferences = (turn.memory_references ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const references = (turn.references ?? []).map((item) => toPlainText(item)).filter(Boolean);
  const challengedAgents = (turn.challenged_agents ?? []).map((item) => toPlainText(item)).filter(Boolean);

  if (cleanMessage) {
    sections.push(cleanMessage);
  }
  if (researchPoints.length) {
    sections.push(`Research: ${researchPoints.join(" ")}`);
  }
  if (keyPoints.length) {
    sections.push(`What this advisor is pushing for: ${keyPoints.join(" ")}`);
  }
  if (assumptions.length) {
    sections.push(`What could break: ${assumptions.join(" ")}`);
  }
  if (calculations.length) {
    sections.push(`Numbers behind the view: ${calculations.join(" ")}`);
  }
  if (memoryReferences.length) {
    sections.push(`Relevant past context: ${memoryReferences.join(" ")}`);
  }
  if (references.length || challengedAgents.length) {
    const referenceLine = references.length ? `Cross-checking: ${references.join(", ")}.` : "";
    const challengeLine = challengedAgents.length ? `Pressuring: ${challengedAgents.join(", ")}.` : "";
    sections.push([referenceLine, challengeLine].filter(Boolean).join(" "));
  }

  return sections.join("\n\n");
}

function clampValue(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function buildFallbackIdeaProfile(turn) {
  const snapshot = turn?.score_snapshot ?? {};
  const name = turn?.agent_name ?? "";
  const dimensionValues = {
    demand: clampValue(Number(snapshot.market_attractiveness ?? 52)),
    pricing: clampValue(Number(snapshot.pricing_power ?? 50)),
    competition: clampValue(Number(snapshot.differentiation_pressure ?? 48)),
    location: clampValue(Math.round(((Number(snapshot.market_attractiveness ?? 50) * 0.55) + 18))),
    operations: clampValue(Number(snapshot.operational_complexity ?? 50)),
    compliance: clampValue(Number(snapshot.compliance_risk ?? 44)),
    friction: clampValue(Number(snapshot.sales_friction ?? 50)),
    finance: clampValue(Number(snapshot.financial_viability ?? 50)),
    talent: clampValue(Number(snapshot.talent_load ?? 48)),
  };
  const detailMap = {
    demand: "Demand fit inferred from the business case and advisor evidence collected so far.",
    pricing: "Pricing room inferred from willingness-to-pay and category positioning signals.",
    competition: "Competitive pressure inferred from the market shape and comparable alternatives.",
    location: "Local fit inferred from audience, geography, and access assumptions in the prompt.",
    operations: "Execution load inferred from setup, delivery, and operational dependencies.",
    compliance: "Compliance burden inferred from permits, safety, privacy, or regulated steps.",
    friction: "Sales friction inferred from buyer process, onboarding drag, and switching barriers.",
    finance: "Commercial fit inferred from revenue quality and the board's economics discussion.",
    talent: "Talent load inferred from specialist hiring, support, and enablement requirements.",
  };
  const profileMap = {
    "CEO Agent": [
      ["Demand", "demand"],
      ["Price", "pricing"],
      ["Friction", "friction"],
      ["Competition", "competition"],
    ],
    "Startup Builder Agent": [
      ["Demand", "demand"],
      ["Local Fit", "location"],
      ["Ops Load", "operations"],
      ["Compliance", "compliance"],
    ],
    "Market Research Agent": [
      ["Demand", "demand"],
      ["Local Fit", "location"],
      ["Price", "pricing"],
      ["Competition", "competition"],
    ],
    "Finance Agent": [
      ["Revenue Fit", "finance"],
      ["Price", "pricing"],
      ["Friction", "friction"],
      ["Ops Load", "operations"],
    ],
    "Marketing Agent": [
      ["Audience", "demand"],
      ["Local Buzz", "location"],
      ["Noise", "competition"],
      ["Offer", "pricing"],
    ],
    "Pricing Agent": [
      ["Budget Fit", "pricing"],
      ["Demand", "demand"],
      ["Noise", "competition"],
      ["Friction", "friction"],
    ],
    "Supply Chain Agent": [
      ["Local Fit", "location"],
      ["Ops Load", "operations"],
      ["Compliance", "compliance"],
      ["Friction", "friction"],
    ],
    "Hiring Agent": [
      ["Demand", "demand"],
      ["Talent", "talent"],
      ["Ops Load", "operations"],
      ["Support", "compliance"],
    ],
    "Risk Agent": [
      ["Compliance", "compliance"],
      ["Ops Load", "operations"],
      ["Dependence", "competition"],
      ["Friction", "friction"],
    ],
    "Sales Strategy Agent": [
      ["Urgency", "demand"],
      ["Ticket", "pricing"],
      ["Cycle", "friction"],
      ["Noise", "competition"],
    ],
  };

  return {
    title: "Startup idea profile",
    subtitle: "Idea-specific fit built from the current business case",
    series: (profileMap[name] ?? profileMap["CEO Agent"]).map(([label, key]) => ({
      label,
      topic: key,
      value: dimensionValues[key],
      detail: detailMap[key],
    })),
  };
}

function buildAgentGraph(turn) {
  const researchSnapshot = turn?.research_snapshot ?? {};
  const sourceLabels = {
    firecrawl: "Firecrawl",
    brightdata: "Bright Data",
    unknown: "Other",
  };

  const topicEntries = Object.entries(researchSnapshot.topic_counts ?? {}).slice(0, 4);
  const rawSourceEntries = Object.entries(researchSnapshot.source_counts ?? {}).filter(([, count]) => Number(count) > 0);
  const sourcePalette = ["#a78bfa", "#60a5fa", "#34d399", "#f59e0b"];
  const sourceItems = rawSourceEntries.map(([source, count], index) => ({
    label: sourceLabels[source] ?? source,
    value: Number(count) || 0,
    color: sourcePalette[index % sourcePalette.length],
  }));
  const startupProfile = researchSnapshot.idea_profile ?? buildFallbackIdeaProfile(turn);
  const ideaItems = (startupProfile.series ?? []).slice(0, 4).map((item) => ({
    label: item.label,
    topic: item.topic,
    value: clampValue(Number(item.value ?? 0)),
    detail: toPlainText(item.detail ?? ""),
  }));
  const sampleTitleCount = Object.values(researchSnapshot.sample_titles ?? {}).reduce(
    (total, titles) => total + (Array.isArray(titles) ? titles.length : 0),
    0,
  );
  const quantitativeBars = [
    {
      label: "Web Hits",
      value: topicEntries.reduce((total, [, count]) => total + (Number(count) || 0), 0),
      display: `${topicEntries.reduce((total, [, count]) => total + (Number(count) || 0), 0)} hits`,
    },
    {
      label: "Topics",
      value: topicEntries.length,
      display: `${topicEntries.length} topics`,
    },
    {
      label: "Sources",
      value: sourceItems.length,
      display: `${sourceItems.length} sources`,
    },
    {
      label: "Comparables",
      value: sampleTitleCount || Math.max(1, (turn?.research_points ?? []).length),
      display: `${sampleTitleCount || Math.max(1, (turn?.research_points ?? []).length)} refs`,
    },
  ];
  const fallbackQuantities = [
    {
      label: "Signals",
      value: Math.max(1, (turn?.key_points ?? []).length),
      display: `${Math.max(1, (turn?.key_points ?? []).length)} signals`,
    },
    {
      label: "Checks",
      value: Math.max(1, (turn?.references ?? []).length + (turn?.challenged_agents ?? []).length),
      display: `${Math.max(1, (turn?.references ?? []).length + (turn?.challenged_agents ?? []).length)} checks`,
    },
    {
      label: "Risks",
      value: Math.max(1, (turn?.assumptions ?? []).length),
      display: `${Math.max(1, (turn?.assumptions ?? []).length)} risks`,
    },
    {
      label: "Math",
      value: Math.max(1, (turn?.calculations ?? []).length),
      display: `${Math.max(1, (turn?.calculations ?? []).length)} lines`,
    },
  ];

  if (topicEntries.length) {
    const maxQuantity = Math.max(...quantitativeBars.map((item) => item.value || 0), 1);
    return {
      title: startupProfile.title ?? "Startup idea profile",
      subtitle: startupProfile.subtitle ?? "Startup-specific market shape from your prompt and live web research",
      barItems: quantitativeBars.map((item) => ({
        ...item,
        height: `${clampValue(((item.value || 0) / maxQuantity) * 100, 18, 100)}%`,
      })),
      ideaItems,
      sourceItems,
      sourced: true,
    };
  }

  const maxFallbackQuantity = Math.max(...fallbackQuantities.map((item) => item.value || 0), 1);
  return {
    title: startupProfile.title ?? "Startup idea profile",
    subtitle: startupProfile.subtitle ?? "Idea-specific fit inferred from the business case",
    barItems: fallbackQuantities.map((item) => ({
      ...item,
      height: `${clampValue(((item.value || 0) / maxFallbackQuantity) * 100, 18, 100)}%`,
    })),
    ideaItems,
    sourceItems: [],
    sourced: false,
  };
}

function getAgentIcon(agentName) {
  const icons = {
    "CEO Agent": Crown,
    "Startup Builder Agent": Rocket,
    "Market Research Agent": Search,
    "Finance Agent": BadgeDollarSign,
    "Marketing Agent": Megaphone,
    "Pricing Agent": BadgeDollarSign,
    "Supply Chain Agent": Truck,
    "Hiring Agent": Users,
    "Risk Agent": ShieldAlert,
    "Sales Strategy Agent": Handshake,
    "General Assistant": Bot,
  };
  return icons[agentName] ?? Bot;
}

function buildLineChartPoints(items = []) {
  if (!items.length) {
    return "";
  }

  const count = items.length;
  return items
    .map((item, index) => {
      const x = count === 1 ? 110 : 16 + (index * 188) / (count - 1);
      const numeric = Number(item.value ?? 0);
      const y = 108 - clampValue(numeric, 0, 100) * 0.9;
      return `${x},${y}`;
    })
    .join(" ");
}

function getLineChartCoordinates(items = [], index = 0) {
  const count = items.length;
  const x = count === 1 ? 110 : 16 + (index * 188) / Math.max(1, count - 1);
  const numeric = Number(items[index]?.value ?? 0);
  const y = 108 - clampValue(numeric, 0, 100) * 0.9;
  return { x, y };
}

function buildChartLabelLines(label = "") {
  const words = String(label).trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return [label];
  }
  if (words.length === 2) {
    return words;
  }
  return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
}

function buildTooltipLines(item) {
  const detail = toPlainText(item?.detail ?? "");
  if (!detail) {
    return [];
  }
  const sentences = detail.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 2) {
    return sentences.slice(0, 2);
  }
  if (detail.length <= 110) {
    return [detail];
  }
  const midpoint = detail.lastIndexOf(" ", 95);
  if (midpoint > 40) {
    return [detail.slice(0, midpoint), detail.slice(midpoint + 1, midpoint + 95)];
  }
  return [detail.slice(0, 95), detail.slice(95, 190)];
}

function getTurnHighlights(turn) {
  return (turn?.key_points ?? []).map((item) => toPlainText(item)).filter(Boolean).slice(0, 2);
}

function getTurnRiskLine(turn) {
  const assumptions = (turn?.assumptions ?? []).map((item) => toPlainText(item)).filter(Boolean);
  return assumptions[0] ?? "";
}

function buildDirectAssistantNotice(message) {
  const clean = toPlainText(message ?? "");
  const fallback =
    "This question is not related to a business case, so the advisor dashboard was skipped. Ask about launch timing, pricing, customers, costs, hiring, risk, or growth if you want a business review.";

  if (!clean) {
    return fallback;
  }

  if (/not related to business|general question|business case/i.test(clean)) {
    return clean;
  }

  return `This question is not related to a business case. ${clean}`;
}

function trimToSentences(text, count = 2) {
  const clean = toPlainText(String(text ?? "").trim());
  if (!clean) {
    return "";
  }

  const sentences = clean.match(/[^.!?]+[.!?]+/g) ?? [clean];
  return sentences.slice(0, count).join(" ").trim();
}

function formatMetricPercent(value) {
  return `${Math.round(clampValue(Number(value ?? 0)))}%`;
}

function toneClassForScore(value) {
  const score = Number(value ?? 0);
  if (score >= 60) {
    return "danger";
  }
  if (score >= 42) {
    return "warning";
  }
  return "success";
}

function getIdeaValue(graph, matcher, fallback = 50) {
  const match = (graph?.ideaItems ?? []).find((item) => matcher(item));
  return clampValue(Number(match?.value ?? fallback));
}

function inferCustomerProfile(problem = "") {
  const lower = String(problem || "").toLowerCase();

  if (/hospital|clinic|insurance approval|ehr|patient/i.test(lower)) {
    return {
      customer: "Hospital ops lead",
      skepticalQuote:
        "Insurance approvals are painful, but I will not add another tool unless it fits our current workflow and clears compliance cleanly.",
      cautiousQuote:
        "I would test this in one department first if you can prove it cuts approval delays without creating rollout pain.",
      readyQuote:
        "If it integrates cleanly and the ROI is visible fast, I would support a paid rollout.",
    };
  }
  if (/game center|gaming center|pc gaming|console gaming|esports|arcade/i.test(lower)) {
    return {
      customer: "Student gamer",
      skepticalQuote:
        "I already have places to play or I can stay home, so I will not pay unless the setup, vibe, and tournaments feel clearly better.",
      cautiousQuote:
        "I would try a low-cost pass or a tournament night first, but only if the location and pricing feel student-friendly.",
      readyQuote:
        "If the systems run smoothly, the place is nearby, and the pricing feels fair, I would come back regularly.",
    };
  }
  if (/skincare|serum|beauty|cosmetic/i.test(lower)) {
    return {
      customer: "Repeat skincare buyer",
      skepticalQuote:
        "I see too many skincare brands making the same promises, so I need real trust signals before I spend on this.",
      cautiousQuote:
        "I would start with one hero product if the ingredients, reviews, and pricing all feel credible.",
      readyQuote:
        "If the product works for my skin and the brand feels trustworthy, I would reorder and recommend it.",
    };
  }
  if (/ev|charging|charger|electric vehicle/i.test(lower)) {
    return {
      customer: "EV driver",
      skepticalQuote:
        "I will not rely on another charging app unless it actually reduces failed bookings and availability surprises.",
      cautiousQuote:
        "I would try it on my usual route first if it makes finding and booking chargers easier than what I use now.",
      readyQuote:
        "If it saves me time and improves booking reliability, it becomes part of my normal charging routine.",
    };
  }
  if (/tutoring|test prep|education|students|skills center|coaching/i.test(lower)) {
    return {
      customer: "Parent or student",
      skepticalQuote:
        "I hear tuition promises all the time, so I need evidence that this actually improves scores before I commit.",
      cautiousQuote:
        "I would start with a short trial or one batch if the teaching quality and results look credible.",
      readyQuote:
        "If the faculty is strong and the outcomes feel real, I would pay for a full program.",
    };
  }
  if (/cloud kitchen|kitchen|food|cafe|restaurant|meal/i.test(lower)) {
    return {
      customer: "Local food buyer",
      skepticalQuote:
        "I have too many food options already, so I will not reorder unless the taste, consistency, and delivery experience are clearly better.",
      cautiousQuote:
        "I would try one order first if the menu is focused, the reviews look strong, and the price feels fair.",
      readyQuote:
        "If the food is consistently good and delivery is reliable, I would become a repeat customer quickly.",
    };
  }
  if (/home service|cleaning|repair|salon at home|beauty at home|plumbing|electrician/i.test(lower)) {
    return {
      customer: "Homeowner or family",
      skepticalQuote:
        "I will not book a new service brand unless I trust the people entering my home and the work quality feels dependable.",
      cautiousQuote:
        "I would test one service first if booking is simple, the pricing is transparent, and reviews feel trustworthy.",
      readyQuote:
        "If the service is on time, professional, and consistent, I would book again and refer it.",
    };
  }
  if (/automation service|ai automation|b2b service|agency|workflow automation/i.test(lower)) {
    return {
      customer: "SME owner or ops manager",
      skepticalQuote:
        "I know my workflow is inefficient, but I will not pay for automation unless the problem, timeline, and payoff are all very clear.",
      cautiousQuote:
        "I would start with one narrow pilot if you can show me exactly what manual work disappears and what it saves me.",
      readyQuote:
        "If you solve one painful workflow without turning it into a messy project, I would pay and expand usage.",
    };
  }
  if (/retail|store|shop|boutique/i.test(lower)) {
    return {
      customer: "Neighborhood shopper",
      skepticalQuote:
        "I will not switch from the stores I already know unless this place gives me something more specific or more convenient.",
      cautiousQuote:
        "I would visit once if the offer feels focused and the pricing makes sense for the area.",
      readyQuote:
        "If the store solves a clear need and the experience is good, I would keep coming back.",
    };
  }
  return {
    customer: "Target customer",
    skepticalQuote:
      "I can see the problem, but I still do not trust this enough to change my current behavior or spending yet.",
    cautiousQuote:
      "I would test this carefully if the proof feels credible and the switching effort looks manageable.",
    readyQuote:
      "If the value is clear and the experience feels dependable, I would be open to buying.",
  };
}

function buildCustomerIntentExamples({ businessProblem, graph, discoveryIdeas = [] }) {
  const primaryIdeaTitle = discoveryIdeas?.[0]?.title ?? "";
  const profile = inferCustomerProfile(primaryIdeaTitle ? `${primaryIdeaTitle} ${businessProblem}` : businessProblem);
  const demandValue = getIdeaValue(graph, (item) => /demand|audience|urgency/i.test(item.label), 56);
  const priceValue = getIdeaValue(graph, (item) => /price|budget|ticket|offer|revenue/i.test(item.label), 52);
  const frictionValue = getIdeaValue(graph, (item) => /friction|cycle|ops|execution/i.test(item.label), 48);
  const competitionValue = getIdeaValue(graph, (item) => /competition|noise|dependence/i.test(item.label), 50);

  const lowTail =
    frictionValue >= 58 || competitionValue >= 58
      ? " The switching effort and uncertainty still feel too high."
      : demandValue <= 48
        ? " I still do not feel enough urgency to act now."
        : " I still need a stronger reason to change what I do today.";
  const mediumTail =
    demandValue >= 58 && frictionValue <= 54
      ? " I would start with a small trial, pilot, or first purchase."
      : " I would move carefully and look for stronger proof before I commit.";
  const highTail =
    priceValue >= 54 && frictionValue <= 48
      ? " If the experience feels smooth and the economics stay sensible, I would move quickly."
      : " If the offer proves itself in real use, I would buy.";

  return [
    {
      speaker: `${profile.customer} - skeptical buyer`,
      quote: `${profile.skepticalQuote}${lowTail}`,
      status: "LOW INTENT",
      tone: "danger",
    },
    {
      speaker: `${profile.customer} - cautious buyer`,
      quote: `${profile.cautiousQuote}${mediumTail}`,
      status: "MEDIUM INTENT",
      tone: "warning",
    },
    {
      speaker: `${profile.customer} - ready buyer`,
      quote: `${profile.readyQuote}${highTail}`,
      status: "HIGH INTENT",
      tone: "success",
    },
  ];
}

function buildAudienceSummary({
  audienceMode,
  loading,
  baseSummary,
  biggestRisk,
  recommendedDirective,
  decisionLabel,
}) {
  if (loading) {
    if (audienceMode === "founder") {
      return "We are turning the advisor debate into a plain-English founder call with the main risk and the next move.";
    }
    if (audienceMode === "operator") {
      return "We are translating the debate into an execution-first memo with failure points, dependencies, and the next operating move.";
    }
    return "We are drafting an investor-ready memo with the current read, the downside concentration, and the next proof step.";
  }

  const summaryCore = trimToSentences(baseSummary, 2) || "The advisory team has finished its review.";
  const cleanRisk = toPlainText(biggestRisk || "Key risk still being identified.");
  const cleanNextMove = toPlainText(recommendedDirective || "No next step has been defined yet.");
  const cleanDecision = toPlainText(decisionLabel || "Move forward with changes");

  if (audienceMode === "founder") {
    return `${cleanDecision}. ${summaryCore} Biggest watchout: ${cleanRisk} Next step: ${cleanNextMove}`;
  }

  if (audienceMode === "operator") {
    return `${cleanDecision}. ${summaryCore} Primary failure surface: ${cleanRisk} Immediate operating move: ${cleanNextMove}`;
  }

  return `${cleanDecision}. ${summaryCore} Downside concentration: ${cleanRisk} Next diligence step: ${cleanNextMove}`;
}

function isOpportunityDiscoveryPrompt(text = "") {
  const lowered = toPlainText(text).toLowerCase();
  if (!lowered) {
    return false;
  }

  return [
    /\bbest\s+(business|startup|idea|venture)\b/,
    /\bwhat\s+(business|startup|idea|venture)\s+should\s+i\s+(start|build|open)\b/,
    /\bwhich\s+(business|startup|idea|venture)\s+should\s+i\s+(start|build|open)\b/,
    /\bbusiness\s+ideas\b/,
    /\bi\s+want\s+to\s+start\s+a\s+business\s+in\b/,
  ].some((pattern) => pattern.test(lowered));
}

function toDisplayCase(value = "") {
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractDiscoveryLocation(text = "") {
  const plain = toPlainText(text);
  if (!plain) {
    return "";
  }

  const patterns = [
    /\bin\s+([A-Za-z][A-Za-z\s-]{2,40})/i,
    /\bnear\s+([A-Za-z][A-Za-z\s-]{2,40})/i,
    /\baround\s+([A-Za-z][A-Za-z\s-]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = plain.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1]
        .replace(/\b(with|for|because|where|what|which|should|can|and)\b.*$/i, "")
        .trim();
      if (cleaned) {
        return toDisplayCase(cleaned);
      }
    }
  }

  return "";
}

function buildDiscoveryIdeas({ businessProblem, audienceMode, graph }) {
  const lowered = toPlainText(businessProblem).toLowerCase();
  const location = extractDiscoveryLocation(businessProblem);
  const placeLabel = location ? ` in ${location}` : "";
  const demandValue = getIdeaValue(graph, (item) => /demand|audience|urgency/i.test(item.label), 56);
  const priceValue = getIdeaValue(graph, (item) => /price|budget|ticket|offer|revenue/i.test(item.label), 52);
  const frictionValue = getIdeaValue(graph, (item) => /friction|cycle|ops|execution/i.test(item.label), 48);
  const competitionValue = getIdeaValue(graph, (item) => /competition|noise|dependence/i.test(item.label), 50);

  const hasStudents = /\b(student|college|campus|hostel|tuition|coaching|exam|school)\b/.test(lowered);
  const hasFamilies = /\b(family|kids|children|residential|parents)\b/.test(lowered);
  const hasTech = /\b(tech|software|ai|saas|app|digital|it|startup)\b/.test(lowered) || /\bhyderabad\b/.test(lowered);
  const hasFood = /\b(food|cafe|restaurant|kitchen|snack|delivery)\b/.test(lowered);

  const templates = [];

  if (hasTech) {
    templates.push({
      id: "ops-services",
      title: `AI automation service${placeLabel}`,
      founderFit: "This is easier to start than a heavy physical business because you can validate demand before renting space or buying inventory.",
      investorFit: "This can become interesting if the wedge is narrow, the buyer pain is urgent, and the sales motion proves repeatable.",
      operatorFit: "This is operationally cleaner than a capex-heavy business if delivery is standardized and the implementation loop is controlled.",
      test: "First test: sell one narrow workflow improvement to a local clinic, school, or SME and see if they will pay for a pilot.",
      watchout: "Watchout: custom work can eat margin if every client asks for a different solution.",
      scoreBias: 6,
    });
  }

  if (hasStudents || /\bhyderabad\b/.test(lowered)) {
    templates.push({
      id: "skills-center",
      title: `Test prep and skills center${placeLabel}`,
      founderFit: "This works well when there is dense student traffic and clear parent or student willingness to pay for outcomes.",
      investorFit: "This can be attractive if retention, referrals, and center economics are strong enough to support expansion.",
      operatorFit: "This is manageable if scheduling, faculty utilization, and seat fill are instrumented tightly from day one.",
      test: "First test: run a small weekend cohort or trial batch before committing to a full center.",
      watchout: "Watchout: quality drops fast if faculty consistency and scheduling discipline are weak.",
      scoreBias: 4,
    });
  }

  if (hasFood || hasStudents || hasFamilies || /\bhyderabad\b/.test(lowered)) {
    templates.push({
      id: "cloud-kitchen",
      title: `Focused cloud kitchen${placeLabel}`,
      founderFit: "A focused food concept can create repeat demand quickly if you choose one strong audience and one dependable menu.",
      investorFit: "This is only attractive if repeat order behavior and contribution margin stay strong despite competition.",
      operatorFit: "This can work if prep, delivery radius, and wastage are tightly controlled rather than treated casually.",
      test: "First test: launch one cuisine or meal category from a shared kitchen and measure repeat orders before expanding.",
      watchout: "Watchout: food businesses look exciting early but become fragile if consistency and margin control slip.",
      scoreBias: 2,
    });
  }

  if (hasFamilies || /\bhyderabad\b/.test(lowered)) {
    templates.push({
      id: "home-services",
      title: `Premium home services brand${placeLabel}`,
      founderFit: "This is usually easier to test with simple service packages before building a larger brand or team.",
      investorFit: "This can be interesting when repeat bookings and local density make acquisition costs efficient.",
      operatorFit: "This works operationally only if technician quality, routing, and service reliability stay tight.",
      test: "First test: offer one high-trust service category in two or three neighborhoods and track repeat bookings.",
      watchout: "Watchout: quality control and worker reliability become the real business very quickly.",
      scoreBias: 1,
    });
  }

  const fallbackTemplates = [
    {
      id: "specialty-retail",
      title: `Specialty neighborhood retail${placeLabel}`,
      founderFit: "A focused retail concept can work if the offer is specific enough that people know exactly why they should visit.",
      investorFit: "This only becomes attractive if same-store demand and margin are strong enough to justify fixed costs.",
      operatorFit: "This is manageable when inventory turns, staffing, and repeat footfall are visible early.",
      test: "First test: validate demand through pop-ups, subscriptions, or a tiny store format before committing fully.",
      watchout: "Watchout: fixed costs can outrun demand if the concept is too broad.",
      scoreBias: 0,
    },
    {
      id: "b2b-services",
      title: `Local B2B services business${placeLabel}`,
      founderFit: "This can start lean because you can sell first and build the delivery system around a narrow need.",
      investorFit: "This becomes interesting only if there is a path from service revenue to repeatable margins.",
      operatorFit: "This is viable when service quality and delivery steps can be standardized quickly.",
      test: "First test: sell one service package to a narrow buyer segment and measure repeat demand.",
      watchout: "Watchout: it gets messy fast if each client expects a different outcome.",
      scoreBias: 3,
    },
  ];

  for (const template of fallbackTemplates) {
    if (!templates.some((item) => item.id === template.id) && templates.length < 3) {
      templates.push(template);
    }
  }

  return templates.slice(0, 3).map((template, index) => {
    const score = clampValue(
      Math.round((demandValue + priceValue + (100 - frictionValue) + (100 - competitionValue)) / 4 + template.scoreBias - index * 2),
    );
    const fit =
      audienceMode === "founder"
        ? template.founderFit
        : audienceMode === "operator"
          ? template.operatorFit
          : template.investorFit;

    return {
      title: template.title,
      score,
      fit,
      test: template.test,
      watchout: template.watchout,
    };
  });
}

function buildAudienceTimelineItems({
  audienceMode,
  loading,
  businessProblem,
  recommendedDirective,
  timelineItems,
}) {
  const isDiscovery = isOpportunityDiscoveryPrompt(businessProblem);
  const fallbackWindows = ["Week 1", "Weeks 1-2", "Weeks 3-6", "Weeks 4-8"];
  const sourceWindows = timelineItems.length ? timelineItems.map((item) => item.window) : fallbackWindows;
  const windows = fallbackWindows.map((fallback, index) => sourceWindows[index] ?? fallback);

  if (audienceMode === "founder") {
    if (isDiscovery) {
      return [
        {
          window: windows[0],
          title: loading
            ? "Narrow the search to one idea worth testing first."
            : "Pick the top 3 business ideas that feel easiest to start, easiest to explain, and most likely to get repeat demand.",
          note: "Founder lens | Ignore ideas that sound impressive but would drain cash or attention too early.",
        },
        {
          window: windows[1],
          title: "Talk to real customers and find out which problem hurts enough that they would pay to solve it soon.",
          note: "Founder lens | Keep this simple: who wants it, why now, and what price does not scare them away.",
        },
        {
          window: windows[2],
          title: "Run a tiny proof test with the strongest idea before renting space, buying inventory, or hiring anyone.",
          note: "Founder lens | A waitlist, preorder, trial, or pilot is enough if it shows real movement.",
        },
        {
          window: windows[3],
          title: "Commit to one idea only after you see demand, workable pricing, and a setup you can actually manage.",
          note: "Founder lens | Use plain stop-or-go rules around interest, margin, and effort before going all in.",
        },
      ];
    }

    return [
      {
        window: windows[0],
        title: loading
          ? "Reduce the case to one simple test."
          : "Choose one customer, one painful problem, and one offer to test first.",
        note: "Founder lens | Start with the smallest version that can still teach you something real.",
      },
      {
        window: windows[1],
        title: "Talk to buyers and learn whether the problem is urgent enough for them to pay, trial, or pilot.",
        note: "Founder lens | You are looking for clear pull, not compliments or curiosity.",
      },
      {
        window: windows[2],
        title: "Launch a narrow first version with a small group instead of trying to serve everyone at once.",
        note: "Founder lens | Keep the offer easy to deliver and easy to explain.",
      },
      {
        window: windows[3],
        title: "Track margin, response rate, and the signs that tell you to keep going, change direction, or stop.",
        note: `Founder lens | ${toPlainText(
          recommendedDirective || "Do not scale until people want it and you can deliver it without chaos.",
        )}`,
      },
    ];
  }

  if (audienceMode === "operator") {
    if (isDiscovery) {
      return [
        {
          window: windows[0],
          title: loading
            ? "Mapping the candidate operating models."
            : "Map the candidate businesses by workflow complexity, staffing burden, asset intensity, and dependency depth before choosing one.",
          note: "Operator lens | Select for controllable throughput, not narrative appeal.",
        },
        {
          window: windows[1],
          title: "Pressure-test the service loop, staffing model, support obligations, and failure points for the top two options.",
          note: "Operator lens | The goal is to expose brittle handoffs, SLA risk, and exception load early.",
        },
        {
          window: windows[2],
          title: "Pilot the option with the lowest execution drag in one site, one workflow, and one staffing pattern.",
          note: "Operator lens | Narrow scope lets you observe throughput, rework, escalation, and quality drift clearly.",
        },
        {
          window: windows[3],
          title: "Instrument quality, unit economics, staffing load, queue pressure, and escalation triggers before formal rollout.",
          note: "Operator lens | Only scale once the operating system is stable under live conditions.",
        },
      ];
    }

    return [
      {
        window: windows[0],
        title: loading
          ? "Freezing the first execution scope."
          : "Freeze the first execution scope, owner map, service thresholds, and exception policy.",
        note: "Operator lens | Lock the workflow and handoff owners before widening the blast radius.",
      },
      {
        window: windows[1],
        title: "Map dependencies, bottlenecks, staffing pressure, support burden, and queue risk for the first phase.",
        note: "Operator lens | This is where you expose operational fragility before customers do.",
      },
      {
        window: windows[2],
        title: "Pilot one workflow or geography and measure where throughput, quality, rework, or service breaks.",
        note: "Operator lens | Keep the rollout constrained enough to isolate the real failure surface.",
      },
      {
        window: windows[3],
        title: "Review operating telemetry and decide whether sequencing, staffing, tooling, or controls must change before scaling.",
        note: `Operator lens | ${toPlainText(
          recommendedDirective || "Hold scale until throughput is stable, failure modes are visible, and controls are holding.",
        )}`,
      },
    ];
  }

  if (isDiscovery) {
    return [
      {
        window: windows[0],
        title: loading
          ? "Ranking the opportunity set."
          : "Rank the business options by market pull, payback shape, downside concentration, and defensibility.",
        note: "Investor lens | You are underwriting which opportunity deserves deeper attention, not approving a full launch yet.",
      },
      {
        window: windows[1],
        title: "Gather customer, pricing, and competitor proof on the two strongest candidates.",
        note: "Investor lens | Demand quality matters more than a broad but weak narrative.",
      },
      {
        window: windows[2],
        title: "Model a small pilot for the lead option and pressure-test GTM efficiency, cost structure, and execution assumptions.",
        note: "Investor lens | The goal is sharper conviction and cleaner downside framing.",
      },
      {
        window: windows[3],
        title: "Decide whether one business has earned deeper diligence or whether the opportunity set still lacks enough proof.",
        note: "Investor lens | Move only when prospective upside is clearer than the downside concentration.",
      },
    ];
  }

  return [
    {
      window: windows[0],
      title: loading
        ? "Isolating the core investment question."
        : "Isolate the underwriting case: customer urgency, pricing power, retention shape, and what would break conviction.",
      note: "Investor lens | Define the proof gates before more capital, time, or conviction is committed.",
    },
    {
      window: windows[1],
      title: "Collect customer proof, reference signals, objections, and competitor evidence that could change the return profile.",
      note: "Investor lens | Separate real pull from a good story that still needs validation.",
    },
    {
      window: windows[2],
      title: "Pressure-test GTM efficiency, implementation burden, margin durability, and the path to acceptable payback.",
      note: "Investor lens | This is where strong narratives usually fail if the economics are soft.",
    },
    {
      window: windows[3],
      title: "Reassess conviction using downside concentration, alignment, and the strength of the new diligence evidence.",
      note: `Investor lens | ${toPlainText(
        recommendedDirective || "Keep the next step tied to proof quality, not optimism.",
      )}`,
    },
  ];
}

function buildPrimaryDecisionView({
  result,
  leadTurn,
  highestRisk,
  recommendedDirective,
  actionPlan,
  explainability,
  businessProblem,
  loading,
  audienceMode,
}) {
  const audienceConfig = getAudienceModeConfig(audienceMode);
  const dashboardConfig = audienceConfig.dashboard;
  const graph = buildAgentGraph(leadTurn);
  const isDiscovery = isOpportunityDiscoveryPrompt(businessProblem);
  const snapshot = leadTurn?.score_snapshot ?? {};
  const demandValue = getIdeaValue(graph, (item) => /demand|audience|urgency/i.test(item.label), 56);
  const priceValue = getIdeaValue(graph, (item) => /price|budget|ticket|offer|revenue/i.test(item.label), 52);
  const frictionValue = getIdeaValue(graph, (item) => /friction|cycle|ops|execution/i.test(item.label), 48);
  const competitionValue = getIdeaValue(graph, (item) => /competition|noise|dependence/i.test(item.label), 50);

  const marketRisk = clampValue(Math.round((100 - demandValue + competitionValue) / 2));
  const executionRisk = clampValue(
    Math.round((frictionValue + Number(snapshot.operational_complexity ?? frictionValue)) / 2),
  );
  const financialRisk = clampValue(
    Math.round(((100 - priceValue) + (100 - Number(snapshot.financial_viability ?? 54))) / 2),
  );
  const downsideRisk = clampValue(
    Math.round((executionRisk + financialRisk + Number(snapshot.compliance_risk ?? 48)) / 3),
  );

  const confidence = clampValue(Number(result?.final_output?.confidence ?? Math.round((100 - downsideRisk + demandValue) / 2)));
  const conflictCount = result?.conflicts?.length ?? 0;
  const scenarioCount = result?.scenario_results?.length ?? 0;

  const riskValues = [marketRisk, executionRisk, financialRisk, downsideRisk];
  const riskItems = riskValues.map((value, index) => ({
    label: dashboardConfig.riskLabels[index] ?? `Risk ${index + 1}`,
    value,
    tone: toneClassForScore(value),
  }));

  const metricValues = [
    100 - marketRisk,
    executionRisk,
    downsideRisk,
    clampValue(100 - conflictCount * 12),
  ];
  const metricToneInputs = [marketRisk * 0.7, executionRisk, downsideRisk, conflictCount * 18];
  const metricItems = metricValues.map((value, index) => ({
    label: dashboardConfig.metricLabels[index] ?? `METRIC_${index + 1}`,
    value,
    tone: toneClassForScore(metricToneInputs[index]),
  }));

  const discoveryIdeas = isDiscovery ? buildDiscoveryIdeas({ businessProblem, audienceMode, graph }) : [];
  const signalCards = buildCustomerIntentExamples({
    businessProblem,
    graph,
    discoveryIdeas,
  });

  const timelineItems =
    actionPlan?.execution_plan?.slice(0, 4).map((step, index) => ({
      window: step.timeline || `[Week ${index + 1}]`,
      title: toPlainText(step.step),
      note: `${step.owner} | KPI: ${toPlainText(step.success_metric)}`,
    })) ?? [];

  if (!timelineItems.length) {
    timelineItems.push(
      {
        window: "[Week 1]",
        title: loading
          ? "Pull research, isolate the core risk, and draft the first launch conditions."
          : toPlainText(recommendedDirective || "Define the first pilot scope and lock the main risk trigger."),
        note: "CEO Agent | KPI: one clear go / hold / change threshold is defined.",
      },
      {
        window: "[Weeks 1-2]",
        title: "Validate the strongest demand and pricing assumptions with real customer evidence.",
        note: "Market Research Agent | KPI: at least one hard proof point is collected.",
      },
      {
        window: "[Weeks 3-4]",
        title: "Pressure-test execution blockers, support load, and implementation drag.",
        note: "Operations + Finance | KPI: the downside case is modeled before spend expands.",
      },
    );
  }

  const audienceTimelineItems = buildAudienceTimelineItems({
    audienceMode,
    loading,
    businessProblem,
    recommendedDirective,
    timelineItems,
  });

  const decision = result?.final_output?.decision;
  const decisionLabel = formatDecisionLabel(decision ?? leadTurn?.stance ?? "MODIFY");
  const title = loading
    ? dashboardConfig.loadingLabel
    : isDiscovery
      ? `${audienceConfig.label} discovery memo: Best directions to test`
      : `${dashboardConfig.titlePrefix}: ${decisionLabel}`;
  const summary = buildAudienceSummary({
    audienceMode,
    loading,
    baseSummary:
      explainability?.final_reasoning_summary ??
      buildAdvisorParagraph(leadTurn) ??
      result?.final_output?.key_reasons?.join(" ") ??
      recommendedDirective ??
      "The advisory team is reviewing the case and drafting a final board call.",
    biggestRisk: highestRisk,
    recommendedDirective,
    decisionLabel,
  });

  return {
    title,
    summary: isDiscovery
      ? audienceMode === "founder"
        ? `We are treating this as idea discovery, not a launch memo. These are the business directions that look most worth testing first${extractDiscoveryLocation(businessProblem) ? ` in ${extractDiscoveryLocation(businessProblem)}` : ""}.`
        : audienceMode === "operator"
          ? `We are treating this as opportunity selection, not rollout approval. These are the business directions with the cleanest operating shape to pressure-test first${extractDiscoveryLocation(businessProblem) ? ` in ${extractDiscoveryLocation(businessProblem)}` : ""}.`
          : `We are treating this as opportunity underwriting, not launch approval. These are the business directions that appear most worthy of deeper diligence first${extractDiscoveryLocation(businessProblem) ? ` in ${extractDiscoveryLocation(businessProblem)}` : ""}.`
      : summary,
    confidence,
    conflictCount,
    scenarioCount,
    graph: {
      ...graph,
      subtitle:
        audienceMode === "founder"
          ? "A simple read on demand, pricing, friction, and competition."
          : audienceMode === "operator"
            ? "A rollout view of demand, operational drag, friction, and dependency pressure."
            : "A diligence read on demand quality, pricing room, execution friction, and competitive pressure.",
    },
    riskItems,
    metricItems,
    signalCards,
    timelineItems: audienceTimelineItems,
    biggestRisk: toPlainText(highestRisk),
    nextMove: isDiscovery
      ? audienceMode === "founder"
        ? "Pick one idea, talk to real customers this week, and run the smallest proof test you can."
        : audienceMode === "operator"
          ? "Pick the option with the cleanest workflow, then pilot one location or one service loop."
          : "Choose one lead opportunity, gather proof on demand and unit economics, and decide whether it deserves deeper diligence."
      : toPlainText(recommendedDirective || "No action step yet."),
    dashboardConfig,
    audienceLabel: audienceConfig.label,
    discoveryIdeas,
    isDiscovery,
  };
}

function buildRadarPoints(items = []) {
  const centerX = 180;
  const centerY = 150;
  const radius = 102;
  return items
    .map((item, index) => {
      const angle = (-Math.PI / 2) + (index * (Math.PI * 2)) / Math.max(items.length, 1);
      const distance = (clampValue(Number(item.value ?? 0)) / 100) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      return `${x},${y}`;
    })
    .join(" ");
}

function getRadarLabelPosition(index, total, radius = 124) {
  const centerX = 180;
  const centerY = 150;
  const angle = (-Math.PI / 2) + (index * (Math.PI * 2)) / Math.max(total, 1);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

function SimulationView({
  agentMeta,
  result,
  loading,
  error,
  chatMessages,
  chatDraft,
  composerOpen,
  composerMode,
  focusedAgentNames,
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
  audienceMode,
  onToggleConsole,
  onApplySample,
  onChatDraftChange,
  onSubmitChat,
  onShowComposer,
  onContinueComposer,
  onToggleFocusedAgent,
  onSelectOnlyFocusedAgent,
  conversationAgentNames,
  onOpenAgentConversation,
  onOpenAgentProfile,
  onClearAgentConversation,
}) {
  const conversationEndRef = useRef(null);
  const audienceConfig = getAudienceModeConfig(audienceMode);
  const dashboardConfig = audienceConfig.dashboard;
  const speakingMeta = getConversationMeta(agentMeta, speakingAgent);
  const activeConversationMeta =
    conversationAgentNames.length === 1 ? getConversationMeta(agentMeta, conversationAgentNames[0]) : null;
  const filteredRounds = conversationAgentNames.length
    ? groupedConversation
        .map(([round, turns]) => [round, turns.filter((turn) => conversationAgentNames.includes(turn.agent_name))])
        .filter(([, turns]) => turns.length)
    : groupedConversation;
  const latestTurnsByAgent = useMemo(() => {
    const map = new Map();
    groupedConversation.forEach(([, turns]) => {
      turns.forEach((turn) => {
        map.set(turn.agent_name, turn);
      });
    });
    return map;
  }, [groupedConversation]);
  const advisorReplyTurns = useMemo(
    () => conversationAgentNames.map((name) => latestTurnsByAgent.get(name)).filter(Boolean),
    [conversationAgentNames, latestTurnsByAgent],
  );
  const hasAnyDiscussion = groupedConversation.some(([, turns]) => turns.length);
  const visibleTurnCount = filteredRounds.reduce((count, [, turns]) => count + turns.length, 0);
  const latestUserMessage = chatMessages[chatMessages.length - 1] ?? null;
  const earlierUserMessages = useMemo(() => chatMessages.slice(0, -1), [chatMessages]);
  const selectedAdvisorLabels = conversationAgentNames.map((name) => agentMeta[name]?.label ?? name);
  const chatTargetLabels = focusedAgentNames.map((name) => agentMeta[name]?.label ?? name);
  const showingFocusedReplies = conversationAgentNames.length > 0;
  const shouldShowFocusedReplyBadge = shouldShowAdvisorStanceBadge(latestUserMessage?.content ?? "");
  const isDirectAnswerThread =
    (result?.conversation?.length ?? 0) > 0 && result.conversation.every((turn) => turn.agent_name === "General Assistant");
  const directAnswerText = buildDirectAssistantNotice(
    result?.conversation?.[0]?.message ?? "The model will answer directly here.",
  );
  const [showConversation, setShowConversation] = useState(false);
  const leadDecisionTurn = useMemo(
    () =>
      latestTurnsByAgent.get("CEO Agent") ??
      Array.from(latestTurnsByAgent.values()).sort((left, right) => Number(right.round ?? 0) - Number(left.round ?? 0))[0] ??
      null,
    [latestTurnsByAgent],
  );
  const primaryDecisionView = useMemo(
    () =>
      buildPrimaryDecisionView({
        result,
        leadTurn: leadDecisionTurn,
        highestRisk,
        recommendedDirective,
        actionPlan,
        explainability,
        businessProblem: latestUserMessage?.content ?? result?.company_name ?? "",
        loading,
        audienceMode,
      }),
    [
      actionPlan,
      audienceMode,
      explainability,
      highestRisk,
      leadDecisionTurn,
      loading,
      latestUserMessage?.content,
      recommendedDirective,
      result,
    ],
  );
  const shouldShowPrimaryDashboard = !isDirectAnswerThread && (loading || hasAnyDiscussion || Boolean(result?.final_output));
  const isContinueMode = composerMode === "continue";

  useEffect(() => {
    setShowConversation(false);
  }, [latestUserMessage?.id]);

  useEffect(() => {
    if (!conversationEndRef.current) {
      return;
    }

    conversationEndRef.current.scrollIntoView({
      behavior: loading ? "smooth" : "auto",
      block: "end",
    });
  }, [chatMessages.length, visibleTurnCount, loading, conversationAgentNames]);

  return (
    <>
      <main className="obsidian-main single-dashboard-mode">
        <section className="obsidian-stream">
          <header className="stream-header">
            <div>
              <div className="header-kicker">
                <span>{loading ? "Analysis Running" : hasAnyDiscussion ? "Analysis Complete" : "Ready To Start"}</span>
                <span className={loading ? "status-dot small" : "status-dot small idle"} />
              </div>
              <h1>{scenarioTitle}</h1>
            </div>
            <div className="round-meter">
              <span>{loading ? `Round ${currentRound || 0} / ${displayedRounds}` : hasAnyDiscussion ? "Review complete" : "Waiting for input"}</span>
              <div className="meter-track">
                <div
                  className="meter-fill"
                  style={{ width: `${Math.max(8, ((currentRound || 1) / displayedRounds) * 100)}%` }}
                />
              </div>
            </div>
          </header>

          <div className="discussion-utility-bar">
            <div className="discussion-utility-copy">
              <strong>Focused on the result</strong>
              <span>
                {audienceMode === "founder"
                  ? "Read the call in plain language first, then open the conversation only if you want the full debate."
                  : audienceMode === "operator"
                    ? "Use the dashboard as the primary operating readout, then open the conversation when you need the full execution debate."
                    : "Start with the diligence dashboard, then open the conversation when you want the full board-level debate."}
              </span>
            </div>
            <div className="discussion-utility-actions">
              <button type="button" className="secondary-action" onClick={onApplySample}>
                Use Example
              </button>
              <button type="button" className="primary-action" onClick={onToggleConsole}>
                Open Detailed Form
              </button>
            </div>
          </div>

          <div className="stream-body">
            {!hasAnyDiscussion && !loading && !chatMessages.length ? (
              <div className="stream-empty">
                <span className="material-symbols-outlined">terminal</span>
                <h2>Ready To Start</h2>
                <p>Type your business question below or open the detailed form if you want to add numbers first.</p>
              </div>
            ) : null}

            {error ? (
              <div className="conversation-error-banner" role="alert">
                <span className="material-symbols-outlined">error</span>
                <div>
                  <strong>We could not get a reply just now.</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : null}

            {earlierUserMessages.length ? (
              <section className="round-section user-history-section">
                <div className="round-divider">
                  <div />
                  <span>Earlier notes from you</span>
                  <div />
                </div>

                {earlierUserMessages.map((message, index) => (
                  <article key={message.id ?? `${message.timestamp}-${index}`} className="debate-message user">
                    <div className="message-icon user">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="message-content">
                      <div className="message-meta">
                        <span className="message-name">You</span>
                        <span className="message-time">Earlier message</span>
                      </div>
                      <div className="message-bubble user">{toPlainText(message.content)}</div>
                      {message.targetAgentNames?.length ? (
                        <div className="message-tags">
                          <span className="message-tag soft">
                            Sent to {message.targetAgentNames.map((name) => agentMeta[name]?.label ?? name).join(", ")}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </section>
            ) : null}

            {latestUserMessage ? (
              <section className="round-section latest-user-section">
                <div className="round-divider">
                  <div />
                  <span>Your latest message</span>
                  <div />
                </div>

                <article className="debate-message user latest-user-message">
                  <div className="message-icon user">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="message-content">
                    <div className="message-meta">
                      <span className="message-name">You</span>
                      <span className="message-time">Just sent</span>
                    </div>
                    <div className="message-bubble user">{toPlainText(latestUserMessage.content)}</div>
                    <div className="message-tags">
                      <span className="message-tag soft">
                        {latestUserMessage.targetAgentNames?.length
                          ? `Sent to ${latestUserMessage.targetAgentNames.map((name) => agentMeta[name]?.label ?? name).join(", ")}`
                          : "Sent to all advisors"}
                      </span>
                    </div>
                  </div>
                </article>
              </section>
            ) : null}

            {shouldShowPrimaryDashboard ? (
              <PrimaryDecisionDashboard
                loading={loading}
                showConversation={showConversation}
                onToggleConversation={() => {
                  if (!showConversation) {
                    onClearAgentConversation();
                  }
                  setShowConversation((current) => !current);
                }}
                view={primaryDecisionView}
              />
            ) : null}

            {!showConversation && isDirectAnswerThread ? (
              <section className="round-section direct-answer-section">
                <div className="round-divider">
                  <div />
                  <span>Direct answer</span>
                  <div />
                </div>

                <article className="direct-answer-panel">
                  <div className="direct-answer-top">
                    <div className="direct-answer-icon">
                      <Bot size={20} strokeWidth={2.1} />
                    </div>
                    <div>
                      <strong>General Assistant</strong>
                      <span>Business review skipped</span>
                    </div>
                  </div>
                  <p>{directAnswerText}</p>
                </article>
              </section>
            ) : null}

            {showConversation && conversationAgentNames.length ? (
              <div className="conversation-filter-bar" style={{ "--agent-accent": activeConversationMeta?.accent ?? "#ffe16d" }}>
                <div>
                  <strong>
                    {conversationAgentNames.length === 1
                      ? `${activeConversationMeta?.label ?? "Advisor"} conversation`
                      : "Selected advisor conversations"}
                  </strong>
                  <p>
                    Showing only replies from {selectedAdvisorLabels.join(", ")}.
                  </p>
                </div>
                <div className="conversation-filter-actions">
                  {conversationAgentNames.length === 1 ? (
                    <button type="button" className="footer-link" onClick={() => onOpenAgentProfile(conversationAgentNames[0])}>
                      Open advisor profile
                    </button>
                  ) : null}
                  <button type="button" className="footer-link" onClick={onClearAgentConversation}>
                    Show all advisors
                  </button>
                </div>
              </div>
            ) : null}

            {showConversation && earlierUserMessages.length ? (
              <section className="round-section user-history-section">
                <div className="round-divider">
                  <div />
                  <span>Earlier notes from you</span>
                  <div />
                </div>

                {earlierUserMessages.map((message, index) => (
                  <article key={message.id ?? `${message.timestamp}-${index}`} className="debate-message user">
                    <div className="message-icon user">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="message-content">
                      <div className="message-meta">
                        <span className="message-name">You</span>
                        <span className="message-time">Earlier message</span>
                      </div>
                      <div className="message-bubble user">{toPlainText(message.content)}</div>
                      {message.targetAgentNames?.length ? (
                        <div className="message-tags">
                          <span className="message-tag soft">
                            Sent to {message.targetAgentNames.map((name) => agentMeta[name]?.label ?? name).join(", ")}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </section>
            ) : null}

            {showConversation ? (
              showingFocusedReplies ? (
                advisorReplyTurns.length ? (
                  <section className="round-section advisor-reply-section">
                    <div className="round-divider">
                      <div />
                      <span>{advisorReplyTurns.length === 1 ? "Advisor answer" : "Advisor answers"}</span>
                      <div />
                    </div>

                    <div className="advisor-dashboard-grid focused">
                      {advisorReplyTurns.map((turn) => {
                        const meta = getConversationMeta(agentMeta, turn.agent_name);
                        const stanceClassName = getStanceClassName(turn.stance);

                        return (
                          <AgentDashboardCard
                            key={`${turn.agent_name}-${turn.round}-direct`}
                            meta={meta}
                            turn={turn}
                            stanceClassName={stanceClassName}
                            summary={buildAdvisorParagraph(turn) || buildDirectAdvisorReply(turn, latestUserMessage?.content ?? "")}
                            highlightItems={getTurnHighlights(turn)}
                            riskLine={getTurnRiskLine(turn)}
                            showFocusedReplyBadge={shouldShowFocusedReplyBadge}
                            onOpenAgentConversation={onOpenAgentConversation}
                            onOpenAgentProfile={onOpenAgentProfile}
                            isActive={turn.agent_name === speakingAgent && !loading}
                            showLatestReply
                          />
                        );
                      })}
                    </div>
                  </section>
                ) : hasAnyDiscussion && !loading ? (
                  <div className="stream-empty conversation-empty">
                    <span className="material-symbols-outlined">{activeConversationMeta?.symbol ?? "groups"}</span>
                    <h2>Waiting for advisor replies</h2>
                    <p>The selected advisors have not replied yet. Send your question and their answers will appear here.</p>
                  </div>
                ) : null
              ) : !isDirectAnswerThread ? (
              filteredRounds.map(([round, turns]) => (
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

                  <div className="advisor-dashboard-grid">
                    {turns.map((turn) => {
                      const meta = getConversationMeta(agentMeta, turn.agent_name);
                      const stanceClassName = getStanceClassName(turn.stance);

                      return (
                        <AgentDashboardCard
                          key={`${turn.agent_name}-${turn.round}`}
                          meta={meta}
                          turn={turn}
                          stanceClassName={stanceClassName}
                          summary={
                            turn.agent_name === "General Assistant"
                              ? toPlainText(turn.message)
                              : buildAdvisorParagraph(turn) || buildRoundSummary(turn)
                          }
                          highlightItems={getTurnHighlights(turn)}
                          riskLine={getTurnRiskLine(turn)}
                          onOpenAgentConversation={onOpenAgentConversation}
                          onOpenAgentProfile={onOpenAgentProfile}
                          isActive={turn.agent_name === speakingAgent && !loading}
                        />
                      );
                    })}
                  </div>
                </section>
              ))
              ) : null
            ) : null}

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

            <div ref={conversationEndRef} className="conversation-end-anchor" />
          </div>

          <footer className={composerOpen ? "stream-footer" : "stream-footer compact"}>
            {composerOpen ? (
              <form
                className="discussion-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmitChat(chatDraft, { mode: composerMode });
                }}
              >
                <div className="composer-targets">
                  <span className="composer-target-label">Talk to</span>
                  <div className="composer-target-chips">
                    <button
                      type="button"
                      className={focusedAgentNames.length ? "target-chip" : "target-chip active"}
                      onClick={() => onSelectOnlyFocusedAgent("")}
                    >
                      All advisors
                    </button>
                    {Object.entries(agentMeta).map(([name, meta]) => (
                      <button
                        key={name}
                        type="button"
                        className={focusedAgentNames.includes(name) ? "target-chip active" : "target-chip"}
                        style={{ "--target-accent": meta.accent }}
                        onClick={() => onToggleFocusedAgent(name)}
                      >
                        <span className="material-symbols-outlined">{meta.symbol}</span>
                        {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="composer-textarea"
                  rows="3"
                  placeholder={
                    isContinueMode && latestUserMessage
                      ? `Continue this ${audienceConfig.label.toLowerCase()} thread with a follow-up on the same business case...`
                      : focusedAgentNames.length === 1
                      ? `Ask ${agentMeta[focusedAgentNames[0]]?.label ?? "this advisor"} something from the ${audienceConfig.label.toLowerCase()} view...`
                      : focusedAgentNames.length > 1
                        ? `Ask ${chatTargetLabels.join(", ")} something from the ${audienceConfig.label.toLowerCase()} view...`
                        : dashboardConfig.placeholder
                  }
                  value={chatDraft}
                  onChange={(event) => onChatDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (!loading && chatDraft.trim().length >= 20) {
                        onSubmitChat(chatDraft, { mode: composerMode });
                      }
                    }
                  }}
                />
                <div className="composer-actions">
                  <span className="composer-hint">
                    {focusedAgentNames.length === 1
                      ? `Your next message will focus on ${agentMeta[focusedAgentNames[0]]?.label ?? "that advisor"}.`
                      : focusedAgentNames.length > 1
                        ? `Your next message will focus on ${chatTargetLabels.join(", ")}.`
                        : isContinueMode
                          ? "This will continue the same topic and send the full chat context back into the review."
                        : dashboardConfig.hint}
                  </span>
                  <div className="composer-action-group">
                    <span className="composer-status">
                      {loading
                        ? `${dashboardConfig.loadingLabel}...`
                        : isContinueMode
                          ? "Follow-up mode is on for this same case"
                        : result
                          ? `${audienceConfig.label} dashboard is visible above`
                          : "Ready for your question"}
                    </span>
                    <button type="submit" className="primary-action" disabled={loading || chatDraft.trim().length < 20}>
                      {loading ? "Reviewing..." : "Send"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="composer-reopen-bar">
                <div className="composer-reopen-copy">
                  <strong>Result view expanded</strong>
                  <span>Start a fresh case or continue this same topic with the current chat context.</span>
                </div>
                <div className="composer-reopen-actions">
                  <button type="button" className="secondary-action" onClick={onShowComposer} disabled={loading}>
                    {loading ? "Review In Progress" : "Ask Another Question"}
                  </button>
                  <button type="button" className="primary-action" onClick={onContinueComposer} disabled={loading || !chatMessages.length}>
                    {loading ? "Review In Progress" : "Continue Question"}
                  </button>
                </div>
              </div>
            )}
          </footer>
        </section>
      </main>

    </>
  );
}

function PrimaryDecisionDashboard({ loading, showConversation, onToggleConversation, view }) {
  const radarPoints = buildRadarPoints(view.graph.ideaItems);
  const dashboardConfig = view.dashboardConfig;

  return (
    <section className="decision-dashboard-shell">
      <div className="decision-dashboard-head">
        <div className="decision-dashboard-intro">
          <span className="decision-dashboard-kicker">{loading ? dashboardConfig.loadingLabel : dashboardConfig.memoLabel}</span>
          <h2>{view.title}</h2>
          <p>{view.summary}</p>
        </div>
        <div className="decision-dashboard-actions">
          <div className="decision-chip-cluster">
            <span className="decision-chip">{formatMetricPercent(view.confidence)} confidence</span>
            <span className="decision-chip">{view.conflictCount} disagreements</span>
            <span className="decision-chip">{view.scenarioCount} scenarios</span>
          </div>
          <button
            type="button"
            className={showConversation ? "secondary-action conversation-button active" : "secondary-action conversation-button"}
            onClick={onToggleConversation}
          >
            Conversation
          </button>
        </div>
      </div>

      <div className="decision-dashboard-layout">
        <div className="decision-dashboard-main">
          <article className="decision-panel decision-radar-panel">
            <div className="decision-panel-head">
              <div>
                <span className="decision-panel-kicker">{dashboardConfig.profileKicker}</span>
                <strong>{dashboardConfig.profileTitle}</strong>
                <p>{view.graph.subtitle}</p>
              </div>
            </div>
            <svg viewBox="0 0 360 300" className="decision-radar-chart" aria-hidden="true">
              {[28, 56, 84, 112].map((radius) => (
                <polygon
                  key={radius}
                  points={Array.from({ length: Math.max(view.graph.ideaItems.length, 4) }, (_, index) => {
                    const position = getRadarLabelPosition(index, Math.max(view.graph.ideaItems.length, 4), radius);
                    return `${position.x},${position.y}`;
                  }).join(" ")}
                  className="decision-radar-ring"
                />
              ))}
              {view.graph.ideaItems.map((item, index) => {
                const position = getRadarLabelPosition(index, view.graph.ideaItems.length, 132);
                return (
                  <text key={item.label} x={position.x} y={position.y} className="decision-radar-label" textAnchor="middle">
                    {item.label}
                  </text>
                );
              })}
              <polygon points={radarPoints} className="decision-radar-shape" />
            </svg>
          </article>

          {view.discoveryIdeas?.length ? (
            <article className="decision-panel">
              <div className="decision-panel-head">
                <div>
                  <span className="decision-panel-kicker">Best options to test</span>
                  <strong>
                    {view.isDiscovery ? "Concrete business directions" : "Recommended opportunities"}
                  </strong>
                  <p>
                    {view.audienceLabel === "Founder"
                      ? "Choose one direction to test first instead of turning every idea into a full launch."
                      : view.audienceLabel === "Operator"
                        ? "Choose the direction with the cleanest operating shape before you scale any complexity."
                        : "Choose the direction that deserves the next round of conviction and diligence."}
                  </p>
                </div>
              </div>
              <div className="decision-opportunity-grid">
                {view.discoveryIdeas.map((idea) => (
                  <article key={idea.title} className="decision-opportunity-card">
                    <div className="decision-opportunity-top">
                      <div>
                        <strong>{idea.title}</strong>
                        <span>Discovery score</span>
                      </div>
                      <span className="decision-opportunity-score">{idea.score}</span>
                    </div>
                    <p>{idea.fit}</p>
                    <div className="decision-opportunity-lines">
                      <span>{idea.test}</span>
                      <span>{idea.watchout}</span>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ) : null}

          <article className="decision-panel">
            <div className="decision-panel-head">
              <div>
                <span className="decision-panel-kicker">{dashboardConfig.riskKicker}</span>
                <strong>{dashboardConfig.riskTitle}</strong>
              </div>
            </div>
            <div className="decision-risk-list">
              {view.riskItems.map((item) => (
                <div key={item.label} className="decision-risk-row">
                  <span>{item.label}</span>
                  <div className="decision-risk-track">
                    <div className={`decision-risk-fill ${item.tone}`} style={{ width: `${item.value}%` }} />
                  </div>
                  <strong className={`decision-risk-score ${item.tone}`}>{Math.round(item.value)}</strong>
                </div>
              ))}
            </div>
            <p className="decision-risk-footnote">{view.biggestRisk}</p>
          </article>

          <article className="decision-panel">
            <div className="decision-panel-head">
              <div>
                <span className="decision-panel-kicker">{dashboardConfig.signalKicker}</span>
                <strong>{dashboardConfig.signalTitle}</strong>
              </div>
            </div>
            <div className="decision-signal-grid">
              {view.signalCards.map((card) => (
                <article key={`${card.speaker}-${card.status}`} className="decision-signal-card">
                  <span className="decision-signal-speaker">[{card.speaker}]</span>
                  <p>"{card.quote}"</p>
                  <span className={`decision-signal-pill ${card.tone}`}>{card.status}</span>
                </article>
              ))}
            </div>
          </article>
        </div>

        <div className="decision-dashboard-side">
          <article className="decision-panel">
            <div className="decision-panel-head">
              <div>
                <span className="decision-panel-kicker">{dashboardConfig.timelineKicker}</span>
                <strong>{dashboardConfig.timelineTitle}</strong>
              </div>
            </div>
            <div className="decision-timeline">
              {view.timelineItems.map((item) => (
                <article key={`${item.window}-${item.title}`} className="decision-timeline-item">
                  <strong>{item.window}</strong>
                  <div>
                    <p>{item.title}</p>
                    <span>{item.note}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="decision-panel">
            <div className="decision-panel-head">
              <div>
                <span className="decision-panel-kicker">{dashboardConfig.metricKicker}</span>
                <strong>{dashboardConfig.metricTitle}</strong>
              </div>
            </div>
            <div className="decision-metric-list">
              {view.metricItems.map((metric) => (
                <div key={metric.label} className="decision-metric-row">
                  <span>{metric.label}</span>
                  <strong className={metric.tone}>{formatMetricPercent(metric.value)}</strong>
                </div>
              ))}
            </div>
            <div className="decision-next-move">
              <span className="decision-panel-kicker">{dashboardConfig.nextMoveLabel}</span>
              <p>{view.nextMove}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function getStanceClassName(stance) {
  if (stance === "GO") {
    return "tone-go";
  }
  if (stance === "MODIFY") {
    return "tone-modify";
  }
  return "tone-no-go";
}

function AgentDashboardCard({
  meta,
  turn,
  stanceClassName,
  summary,
  highlightItems,
  riskLine,
  onOpenAgentConversation,
  onOpenAgentProfile,
  isActive,
  showLatestReply = false,
  showFocusedReplyBadge = false,
}) {
  const reasoning = buildExpandedReasoningText(turn);
  const graph = buildAgentGraph(turn);
  const Icon = getAgentIcon(turn.agent_name);
  const linePoints = buildLineChartPoints(graph.ideaItems);
  const [hoveredIdeaIndex, setHoveredIdeaIndex] = useState(-1);
  const hoveredIdea = hoveredIdeaIndex >= 0 ? graph.ideaItems[hoveredIdeaIndex] : null;
  const hoveredCoordinates =
    hoveredIdeaIndex >= 0 ? getLineChartCoordinates(graph.ideaItems, hoveredIdeaIndex) : null;

  return (
    <article
      className={isActive ? "advisor-dashboard-card active" : "advisor-dashboard-card"}
      style={{ "--agent-accent": meta.accent }}
    >
      <div className="advisor-dashboard-top">
        <div className="advisor-dashboard-id">
          <div className="advisor-dashboard-icon">
            <Icon size={20} strokeWidth={2.1} />
          </div>
          <div>
            <strong>{meta.label}</strong>
            <span>{showLatestReply ? "Latest reply" : `Round ${turn.round}`}</span>
          </div>
        </div>
        <div className="advisor-dashboard-badges">
          <span className={`message-tag ${stanceClassName}`}>
            {showFocusedReplyBadge ? formatAdvisorStanceLabel(turn.stance) : formatDecisionLabel(turn.stance)}
          </span>
          <span className="message-tag soft">{turn.confidence}% confidence</span>
        </div>
      </div>

      <div className="advisor-dashboard-graph">
        <div className="advisor-dashboard-graph-head">
          <div>
            <span className="advisor-dashboard-label">{graph.title}</span>
            <p className="advisor-dashboard-graph-note">{graph.subtitle}</p>
          </div>
        </div>
        <div className="advisor-dashboard-chart-grid">
          <div className="advisor-line-panel">
            {hoveredIdea && hoveredCoordinates ? (
              <div
                className="advisor-line-tooltip"
                style={{
                  left: `${(hoveredCoordinates.x / 220) * 100}%`,
                  top: `${Math.max(6, (hoveredCoordinates.y / 132) * 100 - 10)}%`,
                }}
              >
                <strong>
                  {hoveredIdea.label} {Math.round(hoveredIdea.value)}
                </strong>
                {buildTooltipLines(hoveredIdea).map((line, index) => (
                  <span key={`${hoveredIdea.label}-tooltip-${index}`}>{line}</span>
                ))}
              </div>
            ) : null}
            <svg viewBox="0 0 220 132" className="advisor-line-chart" aria-hidden="true">
              {[24, 52, 80, 108].map((y) => (
                <line key={`h-${y}`} x1="12" y1={y} x2="208" y2={y} className="advisor-line-grid" />
              ))}
              {graph.ideaItems.map((item, index) => {
                const { x, y } = getLineChartCoordinates(graph.ideaItems, index);
                const labelLines = buildChartLabelLines(item.label);
                return (
                  <g
                    key={item.label}
                    className="advisor-line-hotspot"
                    onMouseEnter={() => setHoveredIdeaIndex(index)}
                    onMouseLeave={() => setHoveredIdeaIndex(-1)}
                  >
                    <circle cx={x} cy={y} r="5.5" className="advisor-line-point" />
                    <circle cx={x} cy={y} r="14" className="advisor-line-hitbox" />
                    <text x={x} y="121" textAnchor="middle" className="advisor-line-label">
                      {labelLines.map((line, lineIndex) => (
                        <tspan key={`${item.label}-${lineIndex}`} x={x} dy={lineIndex === 0 ? 0 : 8}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
              <polyline points={linePoints} className="advisor-line-path" />
            </svg>
          </div>

          <div className="advisor-vertical-chart">
            {graph.barItems.map((item) => (
              <div key={item.label} className="advisor-vertical-item">
                <span className="advisor-vertical-value">{item.display}</span>
                <div className="advisor-vertical-track">
                  <div className="advisor-vertical-fill" style={{ height: item.height }} />
                </div>
                <span className="advisor-vertical-label">{item.label}</span>
              </div>
            ))}
          </div>

          {graph.sourceItems.length ? (
            <div className="advisor-source-legend advisor-source-legend-wide">
              {graph.sourceItems.map((item) => (
                <div key={item.label} className="advisor-source-chip">
                  <i style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <p className="advisor-dashboard-summary">{summary}</p>

      {highlightItems.length ? (
        <div className="advisor-dashboard-section">
          <span className="advisor-dashboard-label">Key Moves</span>
          <ul className="advisor-dashboard-list">
            {highlightItems.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {riskLine ? (
        <div className="advisor-dashboard-risk">
          <span className="advisor-dashboard-label">Watchout</span>
          <p>{riskLine}</p>
        </div>
      ) : null}

      <div className="advisor-dashboard-actions">
        <button type="button" className="footer-link" onClick={() => onOpenAgentConversation(turn.agent_name)}>
          View advisor
        </button>
        <button type="button" className="footer-link" onClick={() => onOpenAgentProfile(turn.agent_name)}>
          Open profile
        </button>
      </div>

      {reasoning ? (
        <details className="message-reasoning">
          <summary>View full reasoning</summary>
          <div className="message-reasoning-body">{reasoning}</div>
        </details>
      ) : null}
    </article>
  );
}

export default SimulationView;
