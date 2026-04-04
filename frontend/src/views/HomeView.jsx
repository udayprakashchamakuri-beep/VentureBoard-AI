import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Radar, ShieldCheck, Sparkles } from "lucide-react";
import HeroSection from "../components/HeroSection";

const featureItems = [
  {
    icon: BrainCircuit,
    title: "AI advisory debate",
    body: "Turn a rough startup prompt into coordinated CEO, finance, pricing, risk, and market feedback.",
  },
  {
    icon: Radar,
    title: "Decision visibility",
    body: "Track why the recommendation changed, where disagreement lives, and what conditions unlock a launch.",
  },
  {
    icon: ShieldCheck,
    title: "Risk-aware execution",
    body: "Push every idea through constraints, downside cases, and staged rollout logic before you commit.",
  },
];

export default function HomeView({ onApplySample, onOpenForm, onGoToDiscussion }) {
  return (
    <div className="home-view-shell">
      <HeroSection onApplySample={onApplySample} onOpenForm={onOpenForm} />

      <section className="home-support-grid">
        {featureItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="home-support-card"
            >
              <div className="home-support-icon">
                <Icon size={18} />
              </div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </motion.article>
          );
        })}
      </section>

      <section className="home-detail-strip">
        <div>
          <span>Built for founders, operators, and investors</span>
          <h2>Use Home for context. Use Discussion for work.</h2>
          <p>
            The new landing surface sets the tone, but the product workspace still lives in Discussion, Overview, Team,
            and Risks. Jump in when you are ready to analyze a live case.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className="home-detail-cta"
          onClick={onGoToDiscussion}
        >
          Go To Discussion
          <ArrowRight size={18} />
        </motion.button>
      </section>

      <section className="home-final-cta">
        <div className="home-final-copy">
          <div className="home-final-kicker">
            <Sparkles size={14} />
            Neural Command Center
          </div>
          <h2>Start from a sample or open the decision form and brief the team.</h2>
        </div>
        <div className="home-final-actions">
          <button type="button" className="home-final-secondary" onClick={onApplySample}>
            Use Example
          </button>
          <button type="button" className="home-final-primary" onClick={onOpenForm}>
            Open Detailed Form
          </button>
        </div>
      </section>
    </div>
  );
}
