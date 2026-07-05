const express = require("express");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// GET /api/history
router.get("/", authMiddleware, (req, res) => {
  const db = req.app.locals.readVault(req.user.id);
  const items = (db.history || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);
  res.json(items);
});

// POST /api/history
router.post("/", authMiddleware, (req, res) => {
  const { methods, best, criteria } = req.body;
  const db = req.app.locals.readVault(req.user.id);
  if (!db.history) db.history = [];

  const entry = {
    id: uuidv4(),
    userId: req.user.id, // kept for backward compatibility if needed, but not strictly needed
    methods: methods.map((m) => ({ id: m.id, name: m.name, score: m.score })),
    best: { id: best.id, name: best.name },
    criteria,
    createdAt: new Date().toISOString(),
  };
  db.history.unshift(entry);
  // Keep last 50 per user
  db.history = db.history.slice(0, 50);
  req.app.locals.writeVault(req.user.id, db);
  res.status(201).json(entry);
});

// DELETE /api/history/:id
router.delete("/:id", authMiddleware, (req, res) => {
  const db = req.app.locals.readVault(req.user.id);
  db.history = (db.history || []).filter((h) => h.id !== req.params.id);
  req.app.locals.writeVault(req.user.id, db);
  res.json({ message: "Deleted" });
});

module.exports = router;
