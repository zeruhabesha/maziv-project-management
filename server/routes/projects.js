import express from "express";
import { authorizeRoles, authenticateToken } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import pkg from "../models/index.cjs";
const { Project, Item, User } = pkg;
import { Op } from 'sequelize';
import { createNotification, getUserNotifications } from "../services/notificationService.js";
const router = express.Router();

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'server', 'uploads', 'projects');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Get all projects
router.get("/", async (req, res) => {
  console.log('GET /api/projects called', req.query);
  try {
    const { status, client, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (client) where.client = { [Op.iLike]: `%${client}%` }; // Use Sequelize.Op for ILIKE

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Item,
          as: "Items", // Adjust as needed based on your association
        },
      ],
      distinct: true, // Ensure correct count when including associations
    });

    const total = count;

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    console.error("Query params:", req.query);
    if (error.stack) console.error("Stack trace:", error.stack);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Get project by ID
router.get("/:id", async (req, res) => {
    console.log('GET /api/projects/:id called', req.params);
    try {
        const { id } = req.params;

        const project = await Project.findByPk(id, {
            include: [
                {
                    model: Item,
                    as: "Items", // Adjust as needed based on your association
                },
            ],
        });

        if (!project) {
            console.log(`Project with ID ${id} not found`);
            return res.status(404).json({ message: "Project not found" });
        }

        const totalItems = project.Items.length;
        const completedItems = project.Items.filter(item => item.status === 'completed').length;
        const inProgressItems = project.Items.filter(item => item.status === 'in_progress').length;
        const pendingItems = project.Items.filter(item => item.status === 'pending').length;
        const overdueItems = project.Items.filter(item => item.deadline < new Date() && item.status !== 'completed').length;

        res.json({
            success: true,
            data: {
                ...project.get({ plain: true }),
                stats: {
                    total_items: totalItems,
                    completed_items: completedItems,
                    in_progress_items: inProgressItems,
                    pending_items: pendingItems,
                    overdue_items: overdueItems,
                    progress_percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
                }
            }
        });
    } catch (error) {
        console.error("Get project error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Create project
router.post("/", async (req, res) => {
  console.log('POST /api/projects called', req.body);
  try {
    const projectData = req.body;
    const project = await Project.create(projectData);

    // Notify all admins and managers
    const notifyUsers = await User.findAll({ where: { role: ["admin", "manager"] } });
    for (const user of notifyUsers) {
      await createNotification(user.id, "project_created", `A new project '${project.name}' has been created.`);
    }

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Create project error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ success: false, message: "Project reference number already exists" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update project (add authenticateToken to get req.user)
router.put("/:id", async (req, res) => {
  console.log('PUT /api/projects/:id called', req.params, req.body);
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get the current project before update
    const projectBefore = await Project.findByPk(id);
    const oldManagerIds = Array.isArray(projectBefore?.manager_ids) ? projectBefore.manager_ids.map(String) : [];
    const newManagerIds = Array.isArray(updates.manager_ids) ? updates.manager_ids.map(String) : oldManagerIds;

    const [updated] = await Project.update(updates, { where: { id }, returning: true });

    if (updated) {
      const updatedProject = await Project.findByPk(id);

      // Notify newly assigned managers
      const newlyAssigned = newManagerIds.filter(mid => !oldManagerIds.includes(mid));
      if (newlyAssigned.length > 0) {
        const notifyUsers = await User.findAll({ where: { id: newlyAssigned } });
        for (const user of notifyUsers) {
          await createNotification(
            user.id,
            "assigned_manager",
            `You have been assigned as a manager to project '${updatedProject.name}'.`
          );
        }
        // Notify the assigner (if not already in newlyAssigned)
        if (req.user && !newlyAssigned.includes(req.user.id.toString())) {
          await createNotification(
            req.user.id,
            "assigned_manager_action",
            `You assigned managers to project '${updatedProject.name}'.`
          );
        }
      }
      return res.json({ success: true, data: updatedProject });
    }
    return res.status(404).json({ success: false, message: "Project not found" });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete project
router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
    console.log('DELETE /api/projects/:id called', req.params);
    try {
        const { id } = req.params;
        const deleted = await Project.destroy({
            where: { id }
        });

        if (deleted) {
            return res.json({ success: true, message: "Project deleted successfully" });
        }
        return res.status(404).json({ success: false, message: "Project not found" });
    } catch (error) {
        console.error("Delete project error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// Upload file to a project
router.post(
  "/:id/upload",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    console.log('POST /api/projects/:id/upload called', req.params, req.file);
    try {
      if (!req.file) {
        console.log("No file uploaded"); // Log no file upload
        return res.status(400).json({ message: "No file uploaded" });
      }
      // Save file info to the database, associated with the project
      const { id } = req.params;
      const project = await Project.findByPk(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      project.file = req.file.filename;
      await project.save();
      res.status(201).json({
        success: true,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/projects/${req.file.filename}`,
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "File upload failed" });
    }
  }
);

// Download file from a project
router.get("/:id/download/:filename", authenticateToken, async (req, res) => {
    console.log('GET /api/projects/:id/download/:filename called', req.params);
    try {
        const { filename } = req.params;
        const filePath = path.join(process.cwd(), "server", "uploads", "projects", filename);
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filename} not found`);
            return res.status(404).json({ message: "File not found" });
        }
        res.download(filePath, filename);
    } catch (error) {
        console.error("File download error:", error);
        res.status(500).json({ message: "File download failed" });
    }
});

router.get("/:id/notifications", async (req, res) => {
  const { id } = req.params;
  const notifications = await getUserNotifications(id);
  res.json({ success: true, data: notifications });
});

// Get completed projects for a user (based on manager_ids)
router.get("/completed/for-user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const projects = await Project.findAll({
      where: {
        status: 'completed',
        manager_ids: { [Op.contains]: [parseInt(userId, 10)] }
      }
    });
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Get completed projects error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;