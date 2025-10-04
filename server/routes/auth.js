import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import models from "../models/index.cjs";

const { User } = models;
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
    const { password: _pw, ...safeUser } = user.get({ plain: true });
    res.status(201).json({ success: true, data: { user: safeUser, token } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
    const { password: _pw, ...safeUser } = user.get({ plain: true });
    res.json({ success: true, data: { user: safeUser, token } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.post('/logout', (req, res) => {
  // For JWT, logout is handled client-side (remove token).
  // Optionally, you can blacklist the token here if needed.
  res.status(200).json({ success: true, message: 'Logged out' });
});

// Me
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Invalid token:", error.message);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

export default router;
