import jwt from "jsonwebtoken";
// import { getSequelize } from "../config/database.cjs";
import pkg from "../config/database.cjs";
const { getSequelize } = pkg;

const { models } = getSequelize();
const { User } = models;

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    console.log("---- AUTH DEBUG ----");
    console.log("Auth header:", req.headers["authorization"]);
    console.log("JWT Secret (middleware):", process.env.JWT_SECRET || "your_jwt_secret");
    console.log("Server time (epoch):", Math.floor(Date.now() / 1000));
    console.log("--------------------");

    const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";
    const decoded = jwt.verify(token, jwtSecret);

    // Get user from database
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      console.log("User not found in database");
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    console.log("Authenticated user:", req.user);
    next();
  } catch (error) {
    console.error("Invalid token:", error.message);
    console.log("Auth header:", req.headers["authorization"]);
    console.log("Token:", token);
    return res.status(403).json({ message: "Invalid token" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access denied.  User role not found." });
    }

    if (!roles.includes(req.user.role)) {
      console.log(
        `User role ${
          req.user.role
        } not authorized for this endpoint. Required roles: ${roles.join(", ")}`
      );
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }
    next();
  };
};