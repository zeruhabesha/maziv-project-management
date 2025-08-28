// server/middleware/auth.js (ESM-only)
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import models from "../models/index.cjs";

const { User } = models;
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

// Optional example pass-through middleware
export default (req, _res, next) => {
  // add any pre-auth logic here if you want
  next();
};

/**
 * Authenticate JWT from Authorization: Bearer <token>
 */
export const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    console.error("Invalid token:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

/**
 * Authorize specific roles
 */
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user?.role) {
    return res.status(403).json({ message: "Access denied. User role not found." });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied. Insufficient permissions." });
  }
  next();
};
