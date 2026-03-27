export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://skill-deploy-0ppx8gx7h4.vercel.app";

export const NAV_ITEMS = [
  { id: "simulation", label: "Discussion", icon: "hub" },
  { id: "intelligence", label: "Overview", icon: "psychology" },
  { id: "agents", label: "Team", icon: "groups" },
  { id: "risk", label: "Risks", icon: "shield" },
];

export const AGENT_META = {
  "CEO Agent": {
    initials: "EX1",
    accent: "#ffe16d",
    symbol: "crown",
    label: "CEO",
    title: "Final decision maker",
    boardRole: "Chief Executive Officer",
  },
  "Startup Builder Agent": {
    initials: "BLD",
    accent: "#ff9f59",
    symbol: "rocket_launch",
    label: "Startup Builder",
    title: "Fast execution",
    boardRole: "Startup Builder",
  },
  "Market Research Agent": {
    initials: "RSH",
    accent: "#9ac9ff",
    symbol: "travel_explore",
    label: "Market Research",
    title: "Customer demand research",
    boardRole: "Market Research",
  },
  "Finance Agent": {
    initials: "FIN",
    accent: "#00ff94",
    symbol: "leaderboard",
    label: "Finance",
    title: "Money and budget",
    boardRole: "Finance",
  },
  "Marketing Agent": {
    initials: "MKT",
    accent: "#ddb7ff",
    symbol: "campaign",
    label: "Marketing",
    title: "Messaging and demand",
    boardRole: "Marketing",
  },
  "Pricing Agent": {
    initials: "PRC",
    accent: "#ffdb3c",
    symbol: "sell",
    label: "Pricing",
    title: "Price planning",
    boardRole: "Pricing",
  },
  "Supply Chain Agent": {
    initials: "OPS",
    accent: "#7be7d4",
    symbol: "local_shipping",
    label: "Operations",
    title: "Delivery and operations",
    boardRole: "Supply Chain",
  },
  "Hiring Agent": {
    initials: "HIR",
    accent: "#f7a6c6",
    symbol: "groups",
    label: "Hiring",
    title: "Team planning",
    boardRole: "Hiring",
  },
  "Risk Agent": {
    initials: "RSK",
    accent: "#ff8f8f",
    symbol: "security",
    label: "Risk",
    title: "What could go wrong",
    boardRole: "Risk",
  },
  "Sales Strategy Agent": {
    initials: "SLS",
    accent: "#ffb870",
    symbol: "handshake",
    label: "Sales",
    title: "Sales plan",
    boardRole: "Sales Strategy",
  },
};

export const sampleProblem = `We are a young software company thinking about selling our AI product to mid-sized hospitals. Our product helps hospitals handle insurance approval work faster, but this new market would require more integrations, a longer sales process, stronger compliance controls, and better customer support. We have about 11 months of cash left, our profit margin is around 68%, we expect it will take 15 months to earn back sales and marketing costs, and we are considering charging about $28,000 per customer each year. The team needs to decide whether to launch now, move forward with changes, or wait.`;

export const defaultTimeline = [
  { round: 1, synopsis: "Round 1 - each advisor shares an opening view." },
  { round: 2, synopsis: "Round 2 - the team challenges weak assumptions." },
  { round: 3, synopsis: "Round 3 - the team agrees on next steps." },
];
