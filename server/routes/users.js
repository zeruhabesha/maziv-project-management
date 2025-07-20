import express from "express";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { authorizeRoles } from "../middleware/auth.js";
import pkg from "../models/index.cjs";
const { Project, Item, User, Alert } = pkg;
import { createNotification, getUserNotifications, markNotificationRead } from "../services/notificationService.js";
import { authenticateToken } from "../middleware/auth.js";
const router = express.Router();

// 🟢 Get all users
router.get("/", async (req, res) => {
    console.log('GET /api/users called');
    try {
        const users = await User.findAll();
        res.json({ success: true, data: users });
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 🟢 Create user (admins only)
router.post("/", async (req, res) => {
    console.log('POST /api/users called', req.body);
    console.log('req.user:', req.user);
    try {
        const { name, email, password, role } = req.body;
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, role });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 🟢 Update user by ID (admin or self)
router.put("/:id", authenticateToken, async (req, res) => {
    console.log('PUT /api/users/:id called', req.params, req.body);
    console.log('req.user:', req.user);
    console.log('req.headers.authorization:', req.headers.authorization);
    try {
        const { id } = req.params;
        const { name, email, role, password } = req.body;
        // Allow if admin, or if the user is updating their own profile
        if (!req.user || !req.user.role) {
            return res.status(403).json({ success: false, message: "Access denied. User role not found." });
        }
        if (req.user.role !== 'admin' && req.user.id.toString() !== id) {
            return res.status(403).json({ success: false, message: "Access denied. Insufficient permissions." });
        }
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.name = name;
        user.email = email;
        // Only allow admin to change role
        if (req.user.role === 'admin' && role) {
            user.role = role;
        }
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        await user.save();
        res.json({ success: true, data: user });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 🟢 Delete user by ID (admin only)
router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
    console.log('DELETE /api/users/:id called', req.params);
    try {
        const { id } = req.params;
        const deletedUser = await User.destroy({ where: { id } });
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get notifications for a user
router.get("/:id/notifications", async (req, res) => {
    console.log('GET /api/users/:id/notifications called', req.params);
    try {
        const { id } = req.params;
        const notifications = await getUserNotifications(id);
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Mark notification as read
router.post("/notifications/:notificationId/read", async (req, res) => {
    console.log('POST /api/users/notifications/:notificationId/read called', req.params);
    try {
        const { notificationId } = req.params;
        const notification = await markNotificationRead(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }
        res.json({ success: true, data: notification });
    } catch (error) {
        console.error("Mark notification read error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Get alerts for a project
router.get('/:id/alerts', async (req, res) => {
  try {
    const userId = req.params.id;
    const { project_id } = req.query;
    if (!project_id) {
      return res.status(400).json({ success: false, message: 'project_id query param is required' });
    }
    const alerts = await Alert.findAll({ where: { user_id: userId, project_id } });
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Get user alerts error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change password for user
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    if (!req.user || req.user.id.toString() !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;