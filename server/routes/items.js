import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createNotification } from "../services/notificationService.js";
import pkg from "../models/index.cjs";
const { Item, Supplier, User, Phase, Project } = pkg;
const router = express.Router();

// Set up multer storage for item files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "server", "uploads", "items");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, base + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Get items for a project
router.get("/", async (req, res) => {
    console.log('GET /api/items called', req.query);
    try {
        const { projectId, status, type, phase, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (projectId) where.project_id = parseInt(projectId, 10);
        if (status) where.status = status;
        if (type) where.type = type;
        if (phase) where.phase_id = phase;

        console.log({ Supplier, User, Phase });

        const items = await Item.findAll({
            where,
            include: [
                { model: Supplier, as: 'Supplier' },
                { model: User, as: 'AssignedTo' },
                { model: Phase, as: 'Phase' }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({ success: true, data: items });
    } catch (error) {
        console.error(
            "Get items error:",
            error,
            error?.stack,
            error?.parent?.sql,
            error?.parent?.parameters,
            error?.parent?.message,
            error?.original?.message,
            error?.message
        );
        res.status(500).json({ success: false, message: error.message || error?.parent?.message || error?.original?.message || "Server error" });
    }
});

// Create item
router.post("/", upload.single("file"), async (req, res) => {
    console.log('POST /api/items called', req.body);
    console.log('Request file:', req.file);
    try {
        const itemData = { ...req.body };

        // Only set file if a file was uploaded
        if (req.file) {
          itemData.file = req.file.filename;
        } else {
          if (typeof itemData.file !== 'string') {
            delete itemData.file;
          }
        }

        // Convert empty strings to null for integer fields
        const integerFields = ['project_id', 'phase_id', 'supplier_id', 'assigned_to'];
        for (const field of integerFields) {
          if (itemData[field] === '' || itemData[field] === undefined) {
            itemData[field] = null;
          } else {
            itemData[field] = Number(itemData[field]);
            if (isNaN(itemData[field])) itemData[field] = null;
          }
        }

        // Validate project_id
        if (!itemData.project_id) {
          return res.status(400).json({ success: false, message: "project_id is required and must be a valid project" });
        }
        const project = await Project.findByPk(itemData.project_id);
        if (!project) {
          return res.status(400).json({ success: false, message: "Project does not exist" });
        }

        // Validate assigned_to user exists if provided
        if (itemData.assigned_to !== null && itemData.assigned_to !== undefined) {
          const user = await User.findByPk(itemData.assigned_to);
          if (!user) {
            return res.status(400).json({ success: false, message: "Assigned user does not exist" });
          }
        }

        // Convert quantity and unit_price to numbers
        itemData.quantity = itemData.quantity ? Number(itemData.quantity) : 0;
        itemData.unit_price = itemData.unit_price ? Number(itemData.unit_price) : 0;

        const item = await Item.create(itemData);
        // Fetch the created item with associations and file field
        const createdItem = await Item.findByPk(item.id, {
          include: [
            { model: Supplier, as: 'Supplier' },
            { model: User, as: 'AssignedTo' },
            { model: Phase, as: 'Phase' }
          ]
        });
        console.log('Created item:', item);
        // Notify assigned user if present, else all managers/admins
        if (item.assigned_to) {
          const assignedUser = await User.findByPk(item.assigned_to);
          if (assignedUser) {
            await createNotification(assignedUser.id, "item_assigned", `You have been assigned to item '${item.name}'.`);
          }
        } else {
          const notifyUsers = await User.findAll({ where: { role: ["admin", "manager"] } });
          for (const user of notifyUsers) {
            await createNotification(user.id, "item_created", `A new item '${item.name}' has been created.`);
          }
        }
        res.status(201).json({ success: true, data: createdItem });
    } catch (error) {
        console.error("Create item error:", error, error?.message, error?.parent?.message, error?.original?.message, error?.errors);
        res.status(500).json({ success: false, message: error.message || error?.parent?.message || error?.original?.message || "Server error" });
    }
});

// Update item
router.put("/:id", async (req, res) => {
    console.log('PUT /api/items/:id called', req.params, req.body);
    try {
        const { id } = req.params;
        const updates = req.body;
        const item = await Item.update(updates, {
            where: { id },
            returning: true, // Important for getting the updated item
            plain: true      // Makes the returned value just the object
        });
        if (item[0] === 0) {
            console.log(`Item with ID ${id} not found`);
            return res.status(404).json({ message: "Item not found" });
        }
        const updatedItem = await Item.findByPk(id, {
            include: [
                { model: Supplier, as: 'Supplier' },
                { model: User, as: 'AssignedTo' },
                { model: Phase, as: 'Phase' }
            ]
        });
        res.json({ success: true, data: updatedItem });
    } catch (error) {
        console.error("Update item error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Delete item
router.delete("/:id", async (req, res) => {
    console.log('DELETE /api/items/:id called', req.params);
    try {
        const { id } = req.params;

        const deletedItem = await Item.destroy({
            where: { id }
        });

        if (!deletedItem) {
            console.log(`Item with ID ${id} not found`);
            return res.status(404).json({ message: "Item not found" });
        }

        res.json({ success: true, message: "Item deleted successfully" });
    } catch (error) {
        console.error("Delete item error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Upload file to an item
router.post(
  "/:id/upload",
  upload.single("file"),
  async (req, res) => {
    console.log('POST /api/items/:id/upload called', req.params, req.file);
    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      // Update the item's file field
      const item = await Item.findByPk(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      item.file = req.file.filename;
      await item.save();
      res.status(201).json({
        success: true,
        data: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/api/items/${id}/download/${req.file.filename}`,
        },
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ success: false, message: "File upload failed" });
    }
  }
);

// Download file from an item
router.get(
  "/:id/download/:filename",
  async (req, res) => {
    console.log('GET /api/items/:id/download/:filename called', req.params);
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), "server", "uploads", "items", filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      res.download(filePath, filename);
    } catch (error) {
      console.error("File download error:", error);
      res.status(500).json({ message: "File download failed" });
    }
  }
);

export default router;