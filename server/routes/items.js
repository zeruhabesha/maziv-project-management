import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { Op } from 'sequelize';

import { createNotification } from '../services/notificationService.js';
import pkg from '../models/index.cjs';
const { Item, Supplier, User, Phase, Project } = pkg;

const router = express.Router();

/* ----------------------------- Uploads config ----------------------------- */

// Allow overriding the uploads root (helpful on Render when using a Persistent Disk)
const UPLOADS_ROOT =
  process.env.UPLOADS_ROOT || path.resolve('uploads'); // <- with Root Dir=server this becomes /opt/render/project/src/server/uploads

const ensureDir = (p) => {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch (_) {}
};

const itemsDir = path.join(UPLOADS_ROOT, 'items');
ensureDir(itemsDir);

// Multer storage for item files
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, itemsDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

// Optional simple file filter (allow common doc/image/pdf types)
// Feel free to extend or remove if you accept any file.
const fileFilter = (_req, file, cb) => {
  const allowed = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Unsupported file type'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* ---------------------------------- List ---------------------------------- */

router.get('/', async (req, res) => {
  try {
    const {
      projectId,
      status,
      type,
      phase,
      page = '1',
      limit = '50',
    } = req.query;

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
        { model: Supplier, as: 'Supplier' },
        { model: User, as: 'AssignedTo' },
        { model: Phase, as: 'Phase' },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Get items error:', error);
    res
      .status(500)
      .json({ success: false, message: error?.message || 'Server error' });
  }
});

/* --------------------------------- Create --------------------------------- */

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const itemData = { ...req.body };

    // Only set file if uploaded
    if (req.file) {
      itemData.file = req.file.filename;
    } else if (typeof itemData.file !== 'string') {
      delete itemData.file;
    }

    // Normalize integer FK fields
    const intFields = ['project_id', 'phase_id', 'supplier_id', 'assigned_to'];
    for (const f of intFields) {
      if (itemData[f] === '' || itemData[f] === undefined) {
        itemData[f] = null;
      } else {
        const n = Number(itemData[f]);
        itemData[f] = Number.isFinite(n) ? n : null;
      }
    }

    // Validate project_id
    if (!itemData.project_id) {
      return res.status(400).json({
        success: false,
        message: 'project_id is required and must be a valid project',
      });
    }
    const project = await Project.findByPk(itemData.project_id);
    if (!project) {
      return res
        .status(400)
        .json({ success: false, message: 'Project does not exist' });
    }

    // Validate assigned user if provided
    if (itemData.assigned_to != null) {
      const user = await User.findByPk(itemData.assigned_to);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: 'Assigned user does not exist' });
      }
    }

    // Numbers
    itemData.quantity = itemData.quantity ? Number(itemData.quantity) : 0;
    itemData.unit_price = itemData.unit_price ? Number(itemData.unit_price) : 0;

    const item = await Item.create(itemData);

    const createdItem = await Item.findByPk(item.id, {
      include: [
        { model: Supplier, as: 'Supplier' },
        { model: User, as: 'AssignedTo' },
        { model: Phase, as: 'Phase' },
      ],
    });

    // Notifications (best-effort; don’t block creating)
    try {
      if (item.assigned_to) {
        const assignedUser = await User.findByPk(item.assigned_to);
        if (assignedUser) {
          await createNotification(
            assignedUser.id,
            'item_assigned',
            `You have been assigned to item '${item.name}'.`,
          );
        }
      } else {
        const notifyUsers = await User.findAll({
          where: { role: { [Op.in]: ['admin', 'manager'] } },
        });
        for (const u of notifyUsers) {
          await createNotification(
            u.id,
            'item_created',
            `A new item '${item.name}' has been created.`,
          );
        }
      }
    } catch (notifyErr) {
      console.warn('Notification error (non-fatal):', notifyErr?.message);
    }

    res.status(201).json({ success: true, data: createdItem });
  } catch (error) {
    console.error('Create item error:', error);
    res
      .status(500)
      .json({ success: false, message: error?.message || 'Server error' });
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
