import express from "express";
import jwt from "jsonwebtoken";
import pkg from "../models/index.cjs";
const { User } = pkg;
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
if (!JWT_SECRET) throw new Error('JWT_SECRET is required');

const router = express.Router();

/**
 * Middleware to authenticate JWT token
 * Adds the user object to the request if authentication is successful
 */
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      console.log("User not found in database");
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Invalid token:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

/**
 * Middleware to authorize user roles
 * @param {...string} roles - List of allowed roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access denied. User role not found." });
    }

    if (!roles.includes(req.user.role)) {
      console.log(
        `User role ${req.user.role} not authorized. Required roles: ${roles.join(", ")}`
      );
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }
    next();
  };
};

export default router;