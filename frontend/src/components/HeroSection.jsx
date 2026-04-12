import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Activity, ShieldCheck, Workflow } from "lucide-react";

export default function HeroSection({ onGoToDiscussion, audienceMode, audienceConfig, onAudienceModeChange }) {
  return (
    <section className="relative isolate min-h-[62vh] w-full overflow-hidden rounded-[32px] border border-white/8 bg-[#050505] text-white shadow-[0_32px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute left-[-8%] top-[-12%] h-[38vh] w-[38vh] rounded-full bg-purple-900/30 blur-[120px]" />
      <div className="absolute bottom-[-12%] right-[-8%] h-[40vh] w-[40vh] rounded-full bg-blue-900/30 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.06)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_10%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 grid min-h-[62vh] grid-cols-1 items-center gap-10 px-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex max-w-2xl flex-col gap-6"
        >
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            <Sparkles size={14} />
            <span>{audienceConfig.eyebrow}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">{audienceConfig.chooserTitle}</span>
            <div className="flex flex-wrap gap-2">
              {[
                ["founder", "Founder"],
                ["investor", "Investor"],
                ["operator", "Operator"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onAudienceModeChange(value)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                    audienceMode === value
                      ? "border-cyan-300/60 bg-cyan-300/12 text-white shadow-[0_0_18px_rgba(103,232,249,0.12)]"
                      : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white lg:text-7xl">
              {audienceConfig.heroTitle}
              <span className="block bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                {audienceConfig.heroSupport}
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-gray-400">
              {audienceConfig.heroBody}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onGoToDiscussion}
              className="group inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-4 font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all hover:bg-purple-500"
            >
              Go to Discussion
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[420px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-sm"
        >
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_35%_30%,rgba(168,85,247,0.24),transparent_28%),radial-gradient(circle_at_70%_35%,rgba(59,130,246,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]">
            <motion.div
              className="absolute left-[14%] top-[12%] h-48 w-48 rounded-full border border-purple-400/20 bg-purple-400/10 blur-[2px]"
              animate={{ y: [0, -16, 0], x: [0, 10, 0], scale: [1, 1.06, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-[16%] right-[14%] h-56 w-56 rounded-full border border-blue-400/20 bg-blue-400/10 blur-[2px]"
              animate={{ y: [0, 18, 0], x: [0, -12, 0], scale: [1, 0.96, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-[14%] rounded-[28px] border border-white/8 bg-black/20 backdrop-blur-sm">
              <div className="grid h-full grid-cols-[1.15fr_0.85fr] gap-4 p-6">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.22em] text-white/45">Board Signal Feed</span>
                      <Activity className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div className="flex h-32 items-end gap-2">
                      {[35, 54, 48, 66, 78, 74, 92, 88].map((value, index) => (
                        <motion.div
                          key={index}
                          className="flex-1 rounded-t-full bg-gradient-to-t from-purple-500/80 to-cyan-400/80"
                          initial={{ height: 18 }}
                          animate={{ height: `${value}%` }}
                          transition={{ duration: 1.2, delay: index * 0.06 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Board conviction</p>
                      <p className="mt-3 text-3xl font-bold text-white">81%</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">Failure exposure</p>
                      <p className="mt-3 text-3xl font-bold text-white">Contained</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                      <Workflow className="h-4 w-4 text-purple-300" />
                      Board Review Sequence
                    </div>
                    <div className="space-y-3">
                      {["Demand Scan", "Red Team", "Decision Memo", "Board Gate"].map((item, index) => (
                        <div key={item} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                          <span className="text-sm text-white/72">{item}</span>
                          <span className={`h-2.5 w-2.5 rounded-full ${index < 3 ? "bg-emerald-400" : "bg-amber-300"}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                      <ShieldCheck className="h-4 w-4 text-cyan-300" />
                      Kill Criteria
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 rounded-full bg-white/8">
                        <div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
                      </div>
                      <p className="text-xs leading-5 text-white/50">
                        Demand proof, downside concentration, and execution drag are being monitored continuously.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-6 top-6 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="text-xs font-medium text-gray-200">War Room Active</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
