import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const Spline = React.lazy(() => import("@splinetool/react-spline"));

export default function HeroSection({ onApplySample, onOpenForm }) {
  return (
    <section className="relative isolate min-h-[62vh] w-full overflow-hidden rounded-[32px] border border-white/8 bg-[#050505] text-white shadow-[0_32px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute left-[-8%] top-[-12%] h-[38vh] w-[38vh] rounded-full bg-purple-900/30 blur-[120px]" />
      <div className="absolute bottom-[-12%] right-[-8%] h-[40vh] w-[40vh] rounded-full bg-blue-900/30 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15" />
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
            <span>AI-Powered Business Decision Studio</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white lg:text-7xl">
              Build clarity for every
              <span className="block bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                venture decision
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-gray-400">
              VentureBoard turns rough business questions into structured advisor debates, launch plans, risk calls, and
              next-step guidance without losing the speed of a chat workflow.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onOpenForm}
              className="group inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-7 py-4 font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all hover:bg-purple-500"
            >
              Open Detailed Form
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onApplySample}
              className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10"
            >
              Use Example
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-[420px] w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-sm"
        >
          <div className="absolute inset-0 z-0">
            <Suspense fallback={<div className="h-full w-full bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.2),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />}>
              <Spline scene="https://prod.spline.design/6Wq1Q7Y9S7Y6QZ7Y/scene.splinecode" />
            </Suspense>
          </div>

          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-6 top-6 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="text-xs font-medium text-gray-200">Live AI Analysis Active</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
