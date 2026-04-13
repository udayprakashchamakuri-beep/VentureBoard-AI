import { useMemo } from "react";
import { getAudienceModeConfig } from "../audienceMode";

function buildPromptExcerpt(prompt) {
  const clean = String(prompt || "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "The advisory team is reviewing the case.";
  }
  return clean.length > 220 ? `${clean.slice(0, 217)}...` : clean;
}

export default function PixelReviewSequence({
  loadingStartedAt,
  latestPrompt,
  scenarioTitle,
  audienceMode,
}) {
  const audienceConfig = getAudienceModeConfig(audienceMode);
  const promptExcerpt = useMemo(() => buildPromptExcerpt(latestPrompt), [latestPrompt]);

  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      audience: audienceConfig.label,
      scenario: scenarioTitle || "Business case review",
      prompt: promptExcerpt,
      startedAt: String(loadingStartedAt || Date.now()),
      runtime: "15",
    });
    return `${import.meta.env.BASE_URL}pixel-review/index.html?${params.toString()}`;
  }, [audienceConfig.label, loadingStartedAt, promptExcerpt, scenarioTitle]);

  return (
    <section className="pixel-review-screen" aria-label="Pixel review sequence">
      <div className="pixel-review-shell pixel-review-shell--embed">
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          title="Pixel office and conference review"
          className="pixel-review-iframe"
        />
      </div>
    </section>
  );
}
