// Authentication routes: register, login, and user profile retrieval.
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Helper to check Mongo connection state: 1 means connected/ready.
// Prevents ambiguous behavior when DB is down (surface 503 early).
function isDbReady() {
  return mongoose.connection?.readyState === 1;
}

// POST /auth/register: create a new account using institutional email.
// Validates domain, hashes password, handles duplicates (409), and returns basic profile.
router.post("/register", async (req, res) => {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "DB no disponible. Configura MONGO_URI o levanta Mongo." });

    const { email, name, password } = req.body || {};
    const normEmail = String(email || "").trim().toLowerCase();

    // Basic sanity check for email and institutional domain gating.
    if (!normEmail.includes("@")) return res.status(400).json({ error: "Email inválido" });
    const domain = normEmail.split("@")[1] || "";
    const isInstitutional = domain === "unisabana.edu.co" || domain.endsWith(".unisabana.edu.co");
    if (!isInstitutional) return res.status(400).json({ error: "Email no institucional (@unisabana.edu.co)" });

    // Password policy example: minimum length 6. Strength rules can be extended.
    if (!password || password.length < 6) return res.status(400).json({ error: "Contraseña muy corta (min 6)" });

    // Hash the password with salt rounds (10). Never store plaintext passwords.
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user document; unique email constraint may throw (code 11000) if duplicated.
    const user = await User.create({ email: normEmail, name, passwordHash });
    return res.json({ id: user._id, email: user.email, name: user.name });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "Email ya registrado" });
    return res.status(500).json({ error: "Error registrando usuario" });
  }
});

// POST /auth/login: authenticate credentials and return a signed JWT for stateless sessions.
router.post("/login", async (req, res) => {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "DB no disponible. Configura MONGO_URI o levanta Mongo." });

    const { email, password } = req.body || {};
    const normEmail = String(email || "").trim().toLowerCase();

    const user = await User.findOne({ email: normEmail });
    if (!user) return res.status(401).json({ error: "Credenciales" });

    // Compare provided password with stored hash. Timing-safe by design in bcrypt.
    const ok = await bcrypt.compare(password || "", user.passwordHash || "");
    if (!ok) return res.status(401).json({ error: "Credenciales" });

    // Issue a JWT including subject and email; 7d expiry balances UX and security for dev.
    const token = jwt.sign({ sub: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token });
  } catch {
    return res.status(500).json({ error: "Error de autenticación" });
  }
});

// GET /auth/me: return the authenticated user's profile.
// Uses requireAuth middleware to verify and attach req.user (JWT claims).
router.get("/me", requireAuth, async (req, res) => {
  try {
    if (!isDbReady()) return res.status(503).json({ error: "DB no disponible" });
    const user = await User.findById(req.user.sub).lean();
    return res.json({ id: user._id, email: user.email, name: user.name });
  } catch {
    return res.status(500).json({ error: "Error cargando perfil" });
  }
});

export default router;
