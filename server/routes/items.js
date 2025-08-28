import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { Op } from "sequelize";
import models from "../models/index.cjs";
import { createNotification } from "../services/notificationService.js";

const router = express.Router();
const { Item, Supplier, Phase, Project, User } = models;

// uploads root (allow override)
const UPLOADS_ROOT = process.env.UPLOADS_ROOT || path.resolve("uploads");
const itemsDir = path.join(UPLOADS_ROOT, "items");
fs.mkdirSync(itemsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, itemsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

const allowed = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const fileFilter = (_req, file, cb) =>
  allowed.has(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported file type"));

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// LIST
router.get("/", async (req, res) => {
  try {
    const { projectId, status, type, phase, page = "1", limit = "50" } = req.query;
    const pageNum = Number.parseInt(String(page), 10) || 1;
    const limitNum = Number.parseInt(String(limit), 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (projectId) where.project_id = Number(projectId);
    if (status) where.status = status;
    if (type) where.type = type;
    if (phase) where.phase_id = Number(phase);

    const items = await Item.findAll({
      where,
      include: [
        { model: Supplier, as: "Supplier" },
        { model: User, as: "AssignedTo" },
        { model: Phase, as: "Phase" },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ success: false, message: error?.message || "Server error" });
  }
});

// CREATE
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.file = req.file.filename; else if (typeof data.file !== "string") delete data.file;

    for (const f of ["project_id", "phase_id", "supplier_id", "assigned_to"]) {
      if (data[f] === "" || data[f] === undefined) data[f] = null;
      else {
        const n = Number(data[f]);
        data[f] = Number.isFinite(n) ? n : null;
      }
    }

    if (!data.project_id) {
      return res.status(400).json({ success: false, message: "project_id is required and must be valid" });
    }
    const project = await Project.findByPk(data.project_id);
    if (!project) return res.status(400).json({ success: false, message: "Project does not exist" });

    if (data.assigned_to != null) {
      const user = await User.findByPk(data.assigned_to);
      if (!user) return res.status(400).json({ success: false, message: "Assigned user does not exist" });
    }

    data.quantity = data.quantity ? Number(data.quantity) : 0;
    data.unit_price = data.unit_price ? Number(data.unit_price) : 0;

    const item = await Item.create(data);
    const createdItem = await Item.findByPk(item.id, {
      include: [
        { model: Supplier, as: "Supplier" },
        { model: User, as: "AssignedTo" },
        { model: Phase, as: "Phase" },
      ],
    });

    // notifications (best-effort)
    try {
      if (item.assigned_to) {
        const assignedUser = await User.findByPk(item.assigned_to);
        if (assignedUser) {
          await createNotification(assignedUser.id, "item_assigned", `You have been assigned to item '${item.name}'.`);
        }
      } else {
        const notifyUsers = await User.findAll({ where: { role: { [Op.in]: ["admin", "manager"] } } });
        for (const u of notifyUsers) {
          await createNotification(u.id, "item_created", `A new item '${item.name}' has been created.`);
        }
      }
    } catch (notifyErr) {
      console.warn("Notification error (non-fatal):", notifyErr?.message);
    }

    res.status(201).json({ success: true, data: createdItem });
  } catch (error) {
    console.error("Create item error:", error);
    res.status(500).json({ success: false, message: error?.message || "Server error" });
  }
});

/* --------------------------------- Update --------------------------------- */

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [affected] = await Item.update(req.body, {
      where: { id },
      returning: false,
    });

    if (affected === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const updated = await Item.findByPk(id, {
      include: [
        { model: Supplier, as: 'Supplier' },
        { model: User, as: 'AssignedTo' },
        { model: Phase, as: 'Phase' },
      ],
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* --------------------------------- Delete --------------------------------- */

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to delete any attached file as well
    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.file) {
      const filePath = path.join(itemsDir, path.basename(item.file));
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Failed to remove file (non-fatal):', e?.message);
      }
    }

    await Item.destroy({ where: { id } });
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/* -------------------------------- Upload ---------------------------------- */

router.post('/:id/upload', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Clean up any previous file
    if (item.file) {
      const prev = path.join(itemsDir, path.basename(item.file));
      try {
        if (fs.existsSync(prev)) fs.unlinkSync(prev);
      } catch (e) {
        console.warn('Failed to remove previous file (non-fatal):', e?.message);
      }
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
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
});

/* ------------------------------- Download --------------------------------- */

router.get('/:id/download/:filename', async (req, res) => {
  try {
    // prevent path traversal
    const safe = path.basename(req.params.filename);
    const filePath = path.join(itemsDir, safe);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.download(filePath, safe);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ message: 'File download failed' });
  }
});

export default router;
