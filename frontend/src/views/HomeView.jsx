import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Radar, ShieldCheck, Sparkles } from "lucide-react";
import HeroSection from "../components/HeroSection";
import { getAudienceModeConfig } from "../audienceMode";

const featureIcons = [BrainCircuit, Radar, ShieldCheck];

export default function HomeView({
  onGoToDiscussion,
  audienceMode,
  onAudienceModeChange,
}) {
  const audienceConfig = getAudienceModeConfig(audienceMode);

  return (
    <div className="home-view-shell">
      <HeroSection
        onGoToDiscussion={onGoToDiscussion}
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
      </section>

      <section className="home-final-cta">
        <div className="home-final-copy">
          <div className="home-final-kicker">
            <Sparkles size={14} />
            How it works
          </div>
          <h2>Choose your seat once, then use Discussion to pressure-test the decision through that lens.</h2>
          <p>
            Founders get clearer language and simpler calls. Investors get a diligence-oriented read.
            Operators get more execution detail, dependencies, and failure-surface thinking.
          </p>
        </div>
      </section>
    </div>
  );
}
