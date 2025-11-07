import { motion } from "framer-motion";
import { pageTransition } from "../theme/motion.js";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Home() {
  const { palette } = useTheme();
  return (
    <motion.section
      className={`rounded-3xl p-10 shadow-2xl text-white ${palette.card}`}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      <p className="text-sm uppercase tracking-[0.4em] text-white/60">Wheels Sabana</p>
      <h1 className="mt-4 text-4xl font-bold text-white">Red de movilidad universitaria</h1>
      <p className="mt-3 max-w-2xl text-sm text-white/70">
        Conecta conductores y pasajeros de La Sabana en un ecosistema seguro, inteligente y lleno de estilo futurista.
        Explora el Atlas de historias, gestiona tus vehículos y reserva viajes sincronizados en tiempo real.
      </p>
    </motion.section>
  );
}
