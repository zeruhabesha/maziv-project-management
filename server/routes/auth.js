import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pkg from "../models/index.cjs";
const { User } = pkg;

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      console.log("User already exists"); // Log user exists
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "9e2a4fa0b6e548a54f0e212cf90b06be9e367cb1d2f2184bb3d3449e31a91196e",
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  console.log('POST /api/auth/login called', req.body);
  try {
    const { email, password } = req.body;

    // Check if user exists in database
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log("Invalid credentials - user not found in database"); // Log invalid credentials
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password for database users
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid credentials - password mismatch"); // Log invalid credentials
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "30d" }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.get({ plain: true }); // Use get({plain: true})

    res.json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      console.log("No token provided"); // Log no token
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      console.log("User not found"); // Log user not found
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Invalid token:", error.message); // Log token error
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

export default router;