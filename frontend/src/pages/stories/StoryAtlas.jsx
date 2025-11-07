import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { pageTransition, cardHover } from "../../theme/motion.js";
import { useTheme } from "../../context/ThemeContext.jsx";
import { stories } from "./templates/storyData.js";

export default function StoryAtlas() {
  const { palette } = useTheme();
  return (
    <motion.section
      className="grid gap-8"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <header className={`rounded-3xl p-10 text-white shadow-2xl ${palette.card}`}>
        <p className="text-sm uppercase tracking-[0.4em] text-white/60">Experience OS</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Wheels Sabana Story Atlas</h1>
        <p className="mt-3 max-w-3xl text-base text-white/80">
          Navigate each user story as a fully themed screen. Explore requirements, API contracts, and checklists in a
          futuristic command center.
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.4em] text-white/60">
          {stories.length} curated experiences
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {stories.map((story) => (
          <motion.article
            key={story.id}
            className={`group relative overflow-hidden rounded-3xl p-6 text-white ${palette.card}`}
            variants={cardHover}
            initial="rest"
            animate="rest"
            whileHover="hover"
          >
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">{story.epic}</p>
              <h2 className="text-xl font-semibold text-white group-hover:text-white">{story.title}</h2>
              <p className="text-sm text-white/70 line-clamp-3">{story.description}</p>
              <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/50">
                <span className="rounded-full border border-white/20 px-3 py-1">{story.priority}</span>
                <span className="rounded-full border border-white/20 px-3 py-1">{story.id}</span>
              </div>
            </div>
            <Link
              to={`/stories/${story.slug}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80 transition group-hover:bg-white/20"
            >
              Enter
              <span aria-hidden>→</span>
            </Link>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
