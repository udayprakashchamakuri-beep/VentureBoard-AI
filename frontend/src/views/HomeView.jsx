import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, Radar, ShieldCheck, Sparkles } from "lucide-react";
import HeroSection from "../components/HeroSection";
import { getAudienceModeConfig } from "../audienceMode";

const featureIcons = [BrainCircuit, Radar, ShieldCheck];

export default function HomeView({
  onApplySample,
  onOpenForm,
  onGoToDiscussion,
  audienceMode,
  onAudienceModeChange,
}) {
  const audienceConfig = getAudienceModeConfig(audienceMode);

  return (
    <div className="home-view-shell">
      <HeroSection
        onApplySample={onApplySample}
        onOpenForm={onOpenForm}
        audienceMode={audienceMode}
        audienceConfig={audienceConfig}
        onAudienceModeChange={onAudienceModeChange}
      />

      <section className="home-support-grid">
        {audienceConfig.featureItems.map((item, index) => {
          const Icon = featureIcons[index] ?? BrainCircuit;
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
          <span>{audienceConfig.detailKicker}</span>
          <h2>{audienceConfig.detailTitle}</h2>
          <p>{audienceConfig.detailBody}</p>
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
            {audienceConfig.eyebrow}
          </div>
          <h2>Choose your seat, then open Discussion and run the case through that lens.</h2>
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
