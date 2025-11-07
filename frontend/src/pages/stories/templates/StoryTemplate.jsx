import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { pageTransition } from "../../../theme/motion.js";
import { useTheme } from "../../../context/ThemeContext.jsx";

export default function StoryTemplate({ story }) {
  const { palette } = useTheme();
  if (!story) return null;
  return (
    <motion.section
      className="relative grid gap-6 text-white"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <header className={`rounded-3xl p-8 shadow-2xl ${palette.card}`}>
        <p className="text-sm uppercase tracking-[0.4em] text-white/60">{story.epic}</p>
        <h1 className="mt-4 text-4xl font-bold text-white">{story.title}</h1>
        <p className="mt-3 max-w-3xl text-base text-white/80">{story.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
          <span className="rounded-full border border-white/20 px-3 py-1">Priority: {story.priority}</span>
          {story.labels?.map((label) => (
            <span key={label} className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
              {label}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <motion.div className={`rounded-3xl p-8 ${palette.card}`} whileHover={{ scale: 1.01 }}>
          <h2 className="text-2xl font-semibold text-white">Acceptance Criteria</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {story.acceptanceCriteria.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-white/60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div className={`rounded-3xl p-8 ${palette.card}`} whileHover={{ scale: 1.01 }}>
          <h2 className="text-2xl font-semibold text-white">API Contract</h2>
          <div className="mt-4 space-y-3 text-sm text-white/80">
            <p>
              <span className="font-semibold text-white">Endpoint:</span> {story.apiContract?.endpoint}
            </p>
            <p>
              <span className="font-semibold text-white">Method:</span> {story.apiContract?.method}
            </p>
            <p className="text-white/70">{story.apiContract?.sideNote}</p>
          </div>
        </motion.div>
      </div>

      <motion.div className={`rounded-3xl p-8 ${palette.card}`} whileHover={{ scale: 1.01 }}>
        <h2 className="text-2xl font-semibold text-white">Checklist</h2>
        <ul className="mt-4 grid gap-3 text-sm text-white/80 sm:grid-cols-2">
          {story.checklist.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-white/60" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {story.extra && (
        <motion.div className={`rounded-3xl p-8 ${palette.card}`} whileHover={{ scale: 1.01 }}>
          <h2 className="text-2xl font-semibold text-white">Notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {story.extra.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/stories"
          className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs uppercase tracking-[0.4em] text-white/80 transition hover:bg-white/20"
        >
          Back to Atlas
        </Link>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span>Design token:</span>
          <span className="rounded-full border border-white/20 px-3 py-1">{story.id}</span>
        </div>
      </div>
    </motion.section>
  );
}
