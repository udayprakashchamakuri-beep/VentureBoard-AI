export const DEFAULT_AUDIENCE_MODE = "founder";

export const AUDIENCE_MODES = {
  founder: {
    id: "founder",
    label: "Founder",
    eyebrow: "Founder mode",
    chooserTitle: "Choose your seat",
    heroTitle: "Should we launch, wait, or pivot?",
    heroBody: "Pressure-test your next business move before burning runway.",
    heroSupport: "See what would kill this decision before you commit.",
    detailKicker: "Built for founders",
    detailTitle: "Plain-English decision support for the next move that matters.",
    detailBody: "We translate the team debate into a simple call, the biggest risks, and the first actions you should take.",
    featureItems: [
      {
        title: "Simple call",
        body: "Get a clear launch, wait, or change recommendation without boardroom language getting in the way.",
      },
      {
        title: "Customer reality",
        body: "See how real customers are likely to react before you spend more time or money.",
      },
      {
        title: "Next 30 days",
        body: "Leave with a short action plan you can actually execute with a small team.",
      },
    ],
    dashboard: {
      memoLabel: "Founder decision memo",
      loadingLabel: "Founder memo in progress",
      titlePrefix: "Founder call",
      profileKicker: "Idea profile",
      profileTitle: "How the business idea looks right now",
      signalKicker: "Customer reaction",
      signalTitle: "How buyers are likely to feel",
      timelineKicker: "Action plan",
      timelineTitle: "What you do next",
      metricKicker: "Founder readout",
      metricTitle: "Simple scorecard",
      nextMoveLabel: "Best next step",
      riskKicker: "Risk heatmap",
      riskTitle: "What could break this",
      riskLabels: ["Market risk", "Build risk", "Cash risk", "Overall risk"],
      metricLabels: ["CUSTOMER_PULL", "EXECUTION_DRAG", "RISK_LEVEL", "TEAM_ALIGNMENT"],
      placeholder:
        "Describe the company, the decision, and what could make it fail...",
      hint: "Tip: mention the customer, pricing, constraints, and what could break the plan.",
    },
  },
  investor: {
    id: "investor",
    label: "Investor",
    eyebrow: "Investor mode",
    chooserTitle: "Choose your seat",
    heroTitle: "Run pre-investment diligence in minutes.",
    heroBody: "Surface weaknesses in GTM, pricing, risk, and execution before conviction gets expensive.",
    heroSupport: "See whether this company deserves deeper diligence or caution.",
    detailKicker: "Built for investors",
    detailTitle: "A tighter diligence lens on conviction, downside, and proof gaps.",
    detailBody: "The product keeps the decision readable while preserving the market, financial, and execution trade-offs you care about.",
    featureItems: [
      {
        title: "Conviction check",
        body: "Understand whether the upside is real enough to keep leaning in.",
      },
      {
        title: "Downside map",
        body: "See where the company could fail across demand, economics, and operating complexity.",
      },
      {
        title: "Proof gaps",
        body: "Spot what still needs to be validated before a stronger yes is earned.",
      },
    ],
    dashboard: {
      memoLabel: "Investor decision memo",
      loadingLabel: "Investor memo in progress",
      titlePrefix: "Investment readout",
      profileKicker: "Market profile",
      profileTitle: "What the opportunity shape looks like",
      signalKicker: "Buyer diligence",
      signalTitle: "How the market is likely to respond",
      timelineKicker: "Diligence path",
      timelineTitle: "What proof should come next",
      metricKicker: "Investment readout",
      metricTitle: "Conviction scorecard",
      nextMoveLabel: "Next diligence step",
      riskKicker: "Risk heatmap",
      riskTitle: "Where downside is concentrated",
      riskLabels: ["Market risk", "Execution risk", "Financial risk", "Downside risk"],
      metricLabels: ["MARKET_CONFIDENCE", "EXECUTION_BARRIER", "RISK_SURFACE", "BOARD_ALIGNMENT"],
      placeholder:
        "Describe the company, your thesis, and what could make the investment fail...",
      hint: "Tip: mention market quality, GTM motion, payback, pricing power, execution risk, and what proof you still need.",
    },
  },
  operator: {
    id: "operator",
    label: "Operator",
    eyebrow: "Operator mode",
    chooserTitle: "Choose your seat",
    heroTitle: "Stress-test execution before the rollout breaks.",
    heroBody: "Model dependency drag, delivery load, and failure modes before the plan hits the org.",
    heroSupport: "See what will stall the initiative, where process breaks, and what sequence de-risks the move.",
    detailKicker: "Built for operators",
    detailTitle: "An execution-first dashboard for sequencing, constraints, and failure surface.",
    detailBody: "We keep the strategic decision, but raise the operational detail so you can see where execution will actually crack.",
    featureItems: [
      {
        title: "Constraint map",
        body: "Understand which dependencies, handoffs, and support burdens are most likely to break execution.",
      },
      {
        title: "Failure surface",
        body: "See where the plan becomes fragile before headcount and process are ready.",
      },
      {
        title: "Rollout sequence",
        body: "Leave with a tighter order of operations instead of a vague recommendation.",
      },
    ],
    dashboard: {
      memoLabel: "Operator decision memo",
      loadingLabel: "Operator memo in progress",
      titlePrefix: "Execution readout",
      profileKicker: "Rollout profile",
      profileTitle: "Where the initiative is strong or fragile",
      signalKicker: "Adoption signal",
      signalTitle: "How users and stakeholders are likely to respond",
      timelineKicker: "Operating sequence",
      timelineTitle: "What the rollout needs next",
      metricKicker: "Execution readout",
      metricTitle: "Operational scorecard",
      nextMoveLabel: "Immediate operating move",
      riskKicker: "Failure surface",
      riskTitle: "Where execution could fracture",
      riskLabels: ["Demand volatility", "Operational fragility", "Unit economics pressure", "Failure surface"],
      metricLabels: ["DEMAND_SIGNAL", "DELIVERY_DRAG", "FAILURE_SURFACE", "CROSS_FUNCTION_ALIGNMENT"],
      placeholder:
        "Describe the initiative, the operating constraints, and what would break delivery...",
      hint: "Tip: mention dependencies, service levels, staffing load, process complexity, and where rollout friction will show up first.",
    },
  },
};

export function getAudienceModeConfig(mode) {
  return AUDIENCE_MODES[mode] ?? AUDIENCE_MODES[DEFAULT_AUDIENCE_MODE];
}
