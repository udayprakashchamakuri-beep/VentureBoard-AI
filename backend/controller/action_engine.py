from __future__ import annotations

import re
from statistics import mean
from typing import Dict, List

from backend.controller.schemas import (
    ActionPlan,
    AgentTurn,
    AnalyzeRequest,
    ChannelPlan,
    CostItem,
    ExecutionStep,
    FinancialAssumption,
    FinancialPlan,
    HiringPlan,
    HiringRolePlan,
    MarketingStrategy,
    RevenueProjection,
)


class ActionEngine:
    def build(
        self,
        request: AnalyzeRequest,
        final_decision: str,
        latest_turns: Dict[str, AgentTurn],
    ) -> ActionPlan:
        metrics = self._blended_metrics(latest_turns)
        context = self._build_context(request, latest_turns)
        execution_plan = self._build_execution_plan(request, final_decision, latest_turns, metrics, context)
        marketing_strategy = self._build_marketing_strategy(request, latest_turns, metrics, context)
        financial_plan = self._build_financial_plan(request, final_decision, latest_turns, metrics, context)
        hiring_plan = self._build_hiring_plan(request, final_decision, latest_turns, metrics, context)

        return ActionPlan(
            execution_plan=execution_plan,
            marketing_strategy=marketing_strategy,
            financial_plan=financial_plan,
            hiring_plan=hiring_plan,
        )

    def _build_execution_plan(
        self,
        request: AnalyzeRequest,
        final_decision: str,
        latest_turns: Dict[str, AgentTurn],
        metrics: Dict[str, float],
        context: Dict[str, object],
    ) -> List[ExecutionStep]:
        if context["is_local_business"]:
            return self._build_local_execution_plan(final_decision, context)

        launch_shape = "pilot" if final_decision in {"MODIFY", "NO GO"} else "launch"
        return [
            ExecutionStep(
                step=f"Define the initial {launch_shape} wedge and lock the ICP, use case, and success thresholds.",
                owner="CEO Agent",
                timeline="Week 1",
                success_metric="Board signs off on one segment, one offer, and three measurable launch gates.",
            ),
            ExecutionStep(
                step="Validate 8-10 buyers or design partners and pressure-test urgency, objections, and close blockers.",
                owner="Market Research Agent",
                timeline="Weeks 1-2",
                success_metric="At least 5 qualified buyers confirm the problem is urgent enough to buy or pilot.",
            ),
            ExecutionStep(
                step="Launch the offer with a controlled sales and marketing motion rather than a broad market blast.",
                owner="Sales Strategy Agent",
                timeline="Weeks 3-6",
                success_metric=f"Generate {int(max(12, metrics.get('monthly_leads_required', 12)))} qualified leads and close the first 2 reference customers.",
            ),
            ExecutionStep(
                step="Instrument unit economics, implementation effort, and risk triggers before scaling spend.",
                owner="Finance Agent",
                timeline="Weeks 4-8",
                success_metric=f"Keep modeled payback below {metrics.get('estimated_payback_months', 12):.1f} months and gross margin above {metrics.get('gross_margin_pct', 60):.0f}%.",
            ),
            ExecutionStep(
                step="Review launch data against stop-loss thresholds and either scale, narrow further, or pause.",
                owner="CEO Agent",
                timeline="Day 60-90",
                success_metric="Decision review completed with explicit scale/hold/stop resolution.",
            ),
        ]

    def _build_marketing_strategy(
        self,
        request: AnalyzeRequest,
        latest_turns: Dict[str, AgentTurn],
        metrics: Dict[str, float],
        context: Dict[str, object],
    ) -> MarketingStrategy:
        if context["is_local_business"]:
            return self._build_local_marketing_strategy(metrics, context)

        audience = self._first_objective(request) or f"Decision-makers in {request.industry or 'the target market'}"
        positioning = (
            f"{request.company_name} helps the first target segment remove costly workflow friction without adding operational drag."
        )
        core_message = (
            f"Buyers get faster ROI, lower manual effort, and a clearer payback path than the status quo. "
            f"The board is targeting {metrics.get('estimated_payback_months', 12):.1f}-month payback with disciplined rollout."
        )
        channels = [
            ChannelPlan(
                channel="LinkedIn outbound + founder content",
                objective="Reach operators who own the problem and can sponsor a pilot.",
                message="Lead with the economic cost of the current workflow and show a fast-path pilot.",
                budget_share_pct=35,
            ),
            ChannelPlan(
                channel="Design-partner webinars and case studies",
                objective="Build trust for a high-friction or regulated buyer journey.",
                message="Use real workflow metrics, implementation proof, and ROI snapshots.",
                budget_share_pct=30,
            ),
            ChannelPlan(
                channel="Account-based email + sales sequences",
                objective="Convert identified target accounts into live opportunities.",
                message="Offer a controlled pilot with measured milestones rather than a broad transformation promise.",
                budget_share_pct=35,
            ),
        ]
        ad_angles = [
            "Replace manual workflow bottlenecks with measurable time savings.",
            "Launch a tightly-scoped pilot before committing to full operational change.",
            "Show finance-grade ROI and risk controls before asking for broad adoption.",
        ]
        return MarketingStrategy(
            audience=audience,
            positioning=positioning,
            core_message=core_message,
            channels=channels,
            ad_angles=ad_angles,
        )

    def _build_financial_plan(
        self,
        request: AnalyzeRequest,
        final_decision: str,
        latest_turns: Dict[str, AgentTurn],
        metrics: Dict[str, float],
        context: Dict[str, object],
    ) -> FinancialPlan:
        if context["is_local_business"]:
            return self._build_local_financial_plan(final_decision, metrics, context)

        launch_budget = metrics.get("launch_budget", 60000.0)
        monthly_marketing_cost = round(launch_budget * 0.22, 2)
        monthly_tooling_cost = round(launch_budget * 0.08, 2)
        monthly_delivery_cost = round(launch_budget * 0.11, 2)

        revenue_projection = [
            RevenueProjection(
                milestone="Month 3",
                customers=max(1, int(metrics.get("expected_customers_12m", 6) * 0.2)),
                revenue=round(metrics.get("projected_annual_revenue", 0.0) * 0.18, 2),
            ),
            RevenueProjection(
                milestone="Month 6",
                customers=max(2, int(metrics.get("expected_customers_12m", 6) * 0.45)),
                revenue=round(metrics.get("projected_annual_revenue", 0.0) * 0.42, 2),
            ),
            RevenueProjection(
                milestone="Month 12",
                customers=max(3, int(metrics.get("expected_customers_12m", 6))),
                revenue=round(metrics.get("projected_annual_revenue", 0.0), 2),
            ),
        ]
        assumptions = [
            FinancialAssumption(
                name="Price point",
                value=f"${metrics.get('price_point', 0):,.0f}",
                rationale="Taken from the base commercial model and adjusted through pricing debate.",
            ),
            FinancialAssumption(
                name="Gross margin",
                value=f"{metrics.get('gross_margin_pct', 0):.0f}%",
                rationale="Used to convert revenue into gross profit and payback estimates.",
            ),
            FinancialAssumption(
                name="Expected win rate",
                value=f"{metrics.get('expected_win_rate_pct', 0):.0f}%",
                rationale="Reflects the current mix of demand quality, pricing, and sales friction.",
            ),
            FinancialAssumption(
                name="Launch budget",
                value=f"${launch_budget:,.0f}",
                rationale="Derived from operating complexity, compliance load, and deal size.",
            ),
        ]
        monthly_costs = [
            CostItem(category="Demand generation", monthly_cost=monthly_marketing_cost),
            CostItem(category="Tooling and integrations", monthly_cost=monthly_tooling_cost),
            CostItem(category="Implementation and delivery", monthly_cost=monthly_delivery_cost),
        ]
        roi_estimate = (
            f"{final_decision} path currently models {metrics.get('expected_roi_pct', 0):.1f}% ROI "
            f"with payback in {metrics.get('estimated_payback_months', 0):.1f} months."
        )
        return FinancialPlan(
            assumptions=assumptions,
            monthly_costs=monthly_costs,
            revenue_projection=revenue_projection,
            roi_estimate=roi_estimate,
        )

    def _build_hiring_plan(
        self,
        request: AnalyzeRequest,
        final_decision: str,
        latest_turns: Dict[str, AgentTurn],
        metrics: Dict[str, float],
        context: Dict[str, object],
    ) -> HiringPlan:
        if context["is_local_business"]:
            return self._build_local_hiring_plan(final_decision, context)

        roles = [
            HiringRolePlan(
                role="Implementation / Customer Success Lead",
                timing="Immediate",
                reason="Protect onboarding quality and keep operational strain from spilling into churn.",
                estimated_monthly_cost=6500.0,
            ),
            HiringRolePlan(
                role="Sales Engineer or Solutions Consultant",
                timing="Month 2",
                reason="Support higher-friction deals and shorten time to credible proof.",
                estimated_monthly_cost=7200.0,
            ),
            HiringRolePlan(
                role="Growth or Demand Generation Manager",
                timing="Month 3-4",
                reason="Scale the winning channel after the first pilot economics are proven.",
                estimated_monthly_cost=5800.0,
            ),
        ]
        if final_decision == "NO GO":
            roles = roles[:2]

        return HiringPlan(
            roles=roles,
            hiring_sequence=[
                "Fill customer-facing delivery capacity first.",
                "Add technical sales support once the ICP and offer are stable.",
                "Scale demand generation only after the initial motion proves conversion quality.",
            ],
        )

    def _blended_metrics(self, latest_turns: Dict[str, AgentTurn]) -> Dict[str, float]:
        metric_values: Dict[str, List[float]] = {}
        for turn in latest_turns.values():
            for key, value in turn.estimated_metrics.items():
                metric_values.setdefault(key, []).append(value)
        return {
            key: round(mean(values), 2)
            for key, values in metric_values.items()
            if values
        }

    def _first_objective(self, request: AnalyzeRequest) -> str:
        if request.objectives:
            return request.objectives[0]
        return ""

    def _build_context(self, request: AnalyzeRequest, latest_turns: Dict[str, AgentTurn]) -> Dict[str, object]:
        snapshots = [turn.research_snapshot for turn in latest_turns.values() if turn.research_snapshot]
        context = next((item.get("context", {}) for item in snapshots if item.get("context")), {})
        evidence = next((item.get("evidence_quality", {}) for item in snapshots if item.get("evidence_quality")), {})

        business_type = str(context.get("business_type") or self._extract_business_type(request.business_problem))
        location = str(
            context.get("location_hint")
            or (request.region or "").strip()
            or self._extract_location_hint(request.business_problem)
        )
        is_local = bool(context.get("local_business")) or bool(business_type and location)
        return {
            "is_local_business": is_local,
            "business_type": business_type,
            "location": location,
            "has_place_evidence": bool(evidence.get("has_place_specific_evidence")),
            "place_evidence_level": int(evidence.get("place_evidence_level") or 0),
            "place_evidence_summary": str(evidence.get("summary") or ""),
        }

    def _build_local_execution_plan(self, final_decision: str, context: Dict[str, object]) -> List[ExecutionStep]:
        business_type = str(context["business_type"] or "local business")
        location = str(context["location"] or "the target area")
        evidence_ready = bool(context["has_place_evidence"])
        first_step = (
            f"Run a 3-day street-level demand check for the {business_type} idea in {location}: morning, afternoon, and evening footfall counts plus 15 quick buyer conversations."
            if not evidence_ready
            else f"Shortlist one exact launch site in {location} and validate whether the surrounding footfall matches the demand pattern already found in research."
        )
        return [
            ExecutionStep(
                step=first_step,
                owner="Market Research Agent",
                timeline="Days 1-3",
                success_metric="Have a written footfall log, buyer notes, and one clear yes/no read on whether the street has repeat demand.",
            ),
            ExecutionStep(
                step=f"Map the 5-8 nearest alternatives in {location}, capture menu prices, busiest hours, and what each competitor is missing.",
                owner="CEO Agent",
                timeline="Days 3-5",
                success_metric="Competitor sheet completed with price bands, product gaps, and one clear differentiation angle.",
            ),
            ExecutionStep(
                step="Test a very small first menu, cost each item, and confirm the gross margin after fruit spoilage, labor, rent, and electricity.",
                owner="Finance Agent",
                timeline="Week 1",
                success_metric="Know the per-glass contribution margin and the daily sales needed to break even.",
            ),
            ExecutionStep(
                step="Check permits, hygiene requirements, water/ice sourcing, and the reliability of fruit supply before paying for a full fit-out.",
                owner="Risk Agent",
                timeline="Week 1-2",
                success_metric="All required approvals and supply dependencies listed, with no unresolved red-flag blocker.",
            ),
            ExecutionStep(
                step=(
                    "Open with a soft launch near the best site, track repeat walk-ins for two weeks, then decide whether to scale, move, or stop."
                    if final_decision != "NO GO"
                    else "Do not commit to a permanent outlet yet. Use a temporary stall, pop-up, or short pilot only if the first validation signals improve."
                ),
                owner="Startup Builder Agent",
                timeline="Weeks 2-4",
                success_metric="Two-week launch review completed with repeat customer rate, daily order count, and stop/scale decision.",
            ),
        ]

    def _build_local_marketing_strategy(self, metrics: Dict[str, float], context: Dict[str, object]) -> MarketingStrategy:
        business_type = str(context["business_type"] or "local business")
        location = str(context["location"] or "the target area")
        evidence_summary = str(context["place_evidence_summary"] or "")
        audience = f"Walk-in students, office-goers, and families around {location}"
        positioning = (
            f"A fast, clean, repeat-worthy {business_type} offer for people in {location} who want something fresh, convenient, and fairly priced."
        )
        core_message = (
            f"Win on visibility, speed, taste, and repeat habit rather than broad branding. "
            f"{evidence_summary or 'Local traction still needs to be proven at street level before scaling marketing spend.'}"
        )
        channels = [
            ChannelPlan(
                channel="Signage at the storefront and nearby high-footfall lanes",
                objective="Convert passing traffic into first-time trials.",
                message="Lead with one hero product, one entry price, and one reason to stop right now.",
                budget_share_pct=40,
            ),
            ChannelPlan(
                channel="WhatsApp, Instagram Reels, and local student/community groups",
                objective="Drive repeat visits and word-of-mouth in the immediate area.",
                message="Show freshness, speed of service, and the most visually appealing products.",
                budget_share_pct=25,
            ),
            ChannelPlan(
                channel="Google Maps, local food apps, and neighborhood partnerships",
                objective="Capture discovery from nearby search and office/school demand.",
                message="Make it easy to find, trust, and order from the shop without needing a big brand.",
                budget_share_pct=35,
            ),
        ]
        ad_angles = [
            "Fresh and fast for the people already passing this location every day.",
            "Clear entry pricing and visual appeal that earns the first trial quickly.",
            "Build repeat habit through taste, hygiene, and convenience rather than discounting.",
        ]
        return MarketingStrategy(
            audience=audience,
            positioning=positioning,
            core_message=core_message,
            channels=channels,
            ad_angles=ad_angles,
        )

    def _build_local_financial_plan(
        self,
        final_decision: str,
        metrics: Dict[str, float],
        context: Dict[str, object],
    ) -> FinancialPlan:
        business_type = str(context["business_type"] or "local business")
        location = str(context["location"] or "the target area")
        has_evidence = bool(context["has_place_evidence"])
        default_ticket = 80.0 if "juice" in business_type else 120.0
        avg_ticket = metrics.get("price_point", default_ticket)
        if avg_ticket > 180:
            avg_ticket = default_ticket
        daily_orders = max(35, min(220, round(metrics.get("expected_customers_12m", 90) / 4)))
        monthly_revenue = round(avg_ticket * daily_orders * 30, 2)
        gross_margin = metrics.get("gross_margin_pct", 55.0)
        launch_budget = round(max(120000.0, metrics.get("launch_budget", 180000.0)), 2)

        assumptions = [
            FinancialAssumption(
                name="Average order value",
                value=f"₹{avg_ticket:,.0f}",
                rationale="Used as the first working estimate for walk-in billing until real local pricing is verified.",
            ),
            FinancialAssumption(
                name="Daily orders needed",
                value=f"{daily_orders} orders/day",
                rationale="Rough starting estimate for break-even planning on a small local outlet.",
            ),
            FinancialAssumption(
                name="Gross margin target",
                value=f"{gross_margin:.0f}%",
                rationale="Needs validation after spoilage, labor, rent, and utilities are properly measured.",
            ),
            FinancialAssumption(
                name="Setup budget",
                value=f"₹{launch_budget:,.0f}",
                rationale="Represents fit-out, equipment, deposits, initial stock, and opening working capital.",
            ),
        ]
        monthly_costs = [
            CostItem(category="Rent, power, and utilities", monthly_cost=round(launch_budget * 0.08, 2)),
            CostItem(category="Fruit, consumables, and wastage", monthly_cost=round(monthly_revenue * 0.32, 2)),
            CostItem(category="Staffing and daily operations", monthly_cost=round(launch_budget * 0.06, 2)),
        ]
        revenue_projection = [
            RevenueProjection(milestone="Month 1", customers=daily_orders * 30, revenue=monthly_revenue * 0.65),
            RevenueProjection(milestone="Month 3", customers=daily_orders * 30, revenue=monthly_revenue * 0.9),
            RevenueProjection(milestone="Month 6", customers=int(daily_orders * 34), revenue=monthly_revenue * 1.12),
        ]
        roi_estimate = (
            f"This is still a provisional local-outlet model for {business_type} in {location}; do not treat it as a firm return forecast until site-level pricing, rent, and daily demand are validated."
            if not has_evidence
            else f"Use this as a working outlet model only. Final confidence should come from two weeks of real sales, repeat visits, and margin tracking in {location}."
        )
        return FinancialPlan(
            assumptions=assumptions,
            monthly_costs=monthly_costs,
            revenue_projection=revenue_projection,
            roi_estimate=roi_estimate,
        )

    def _build_local_hiring_plan(self, final_decision: str, context: Dict[str, object]) -> HiringPlan:
        roles = [
            HiringRolePlan(
                role="Owner-operator or shift lead",
                timing="Immediate",
                reason="Someone must own quality, cash handling, and day-part discipline from day one.",
                estimated_monthly_cost=18000.0,
            ),
            HiringRolePlan(
                role="Juice maker / counter staff",
                timing="Soft launch",
                reason="Supports fast service and consistent product quality during peak hours.",
                estimated_monthly_cost=14000.0,
            ),
        ]
        if final_decision != "NO GO":
            roles.append(
                HiringRolePlan(
                    role="Part-time helper for prep and cleaning",
                    timing="After the first repeat-demand proof",
                    reason="Add support only once the outlet shows a stable rush pattern.",
                    estimated_monthly_cost=9000.0,
                )
            )
        return HiringPlan(
            roles=roles,
            hiring_sequence=[
                "Start with the leanest team that can protect hygiene, speed, and consistency.",
                "Add labor only after daily demand patterns and peak hours are proven.",
                "Do not build a large staffing plan before the location itself proves repeat business.",
            ],
        )

    def _extract_location_hint(self, prompt: str) -> str:
        cleaned = re.sub(r"\s+", " ", prompt or "").strip()
        match = re.search(
            r"\b(?:in|at|near)\s+([A-Za-z][A-Za-z\s,\-]{2,60}?)(?:[?.!]|$|\s+(?:what|should|can|will|would|do|does|for)\b)",
            cleaned,
            flags=re.IGNORECASE,
        )
        return re.sub(r"\s+", " ", match.group(1)).strip(" ,") if match else ""

    def _extract_business_type(self, prompt: str) -> str:
        lower = (prompt or "").lower()
        patterns = [
            ("fruit juice shop", r"\bfruit juice shop\b|\bjuice shop\b|\bjuice stall\b|\bjuice center\b|\bsmoothie shop\b"),
            ("tea stall", r"\btea stall\b"),
            ("gaming center", r"\bgame center\b|\bgaming center\b|\barcade\b"),
            ("restaurant", r"\brestaurant\b"),
            ("cafe", r"\bcafe\b|\bcoffee shop\b"),
            ("tuition center", r"\btuition center\b|\bcoaching center\b|\btutoring center\b"),
            ("salon", r"\bsalon\b|\bbeauty parlor\b"),
            ("clinic", r"\bclinic\b"),
            ("gym", r"\bgym\b|\bfitness center\b"),
            ("poultry farm", r"\bpoultry farm\b"),
            ("store", r"\bstore\b|\bshop\b"),
        ]
        for label, pattern in patterns:
            if re.search(pattern, lower):
                return label
        return ""
