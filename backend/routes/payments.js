const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { GoogleGenAI, Type } = require("@google/genai");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Score calculator
const calcScore = (p) => {
  const base = p.security * 0.2 + p.speed * 0.2 + p.availability * 0.2 + p.rewards * 0.2 + p.reliability * 0.2;
  const penalty = p.fee * 0.2;
  return parseFloat(Math.max(0, Math.min(10, base - penalty)).toFixed(2));
};

const clamp = (val, min, max) => {
  const parsed = parseFloat(val);
  if (isNaN(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
};



// GET /api/payments — get all payments for user
router.get("/", authMiddleware, (req, res) => {
  const db = req.app.locals.readVault(req.user.id);
  const items = db.payments.map((p) => ({ ...p, score: calcScore(p) }));
  res.json(items);
});

// POST /api/payments — create new payment method utilizing manual attributes
router.post("/", authMiddleware, async (req, res) => {
  const { name, type, fee, description, speed, security, availability, rewards, reliability } = req.body;

  if (!name || fee == null || speed == null || security == null || availability == null) {
    return res.status(400).json({ message: "name, fee, speed, security, availability required" });
  }

  const item = {
    id: uuidv4(),
    userId: req.user.id,
    name: name.trim(),
    type: type || "custom",
    fee: Math.max(0, parseFloat(fee) || 0),
    speed: clamp(speed, 0, 10),
    security: clamp(security, 0, 10),
    availability: clamp(availability, 0, 10),
    rewards: clamp(rewards, 0, 10),
    reliability: clamp(reliability, 0, 10),
    description: description || "",
    createdAt: new Date().toISOString(),
  };

  const db = req.app.locals.readVault(req.user.id);
  db.payments.push(item);
  req.app.locals.writeVault(req.user.id, db);

  res.status(201).json({ ...item, score: calcScore(item) });
});

// PUT /api/payments/:id
router.put("/:id", authMiddleware, async (req, res) => {
  const db = req.app.locals.readVault(req.user.id);
  const idx = db.payments.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Payment method not found" });

  const { name, type, fee, description, speed, security, availability, rewards, reliability } = req.body;
  
  db.payments[idx] = {
    ...db.payments[idx],
    name: name ?? db.payments[idx].name,
    type: type ?? db.payments[idx].type,
    fee: fee != null ? Math.max(0, parseFloat(fee)) : db.payments[idx].fee,
    speed: speed != null ? clamp(speed, 0, 10) : db.payments[idx].speed,
    security: security != null ? clamp(security, 0, 10) : db.payments[idx].security,
    availability: availability != null ? clamp(availability, 0, 10) : db.payments[idx].availability,
    rewards: rewards != null ? clamp(rewards, 0, 10) : db.payments[idx].rewards,
    reliability: reliability != null ? clamp(reliability, 0, 10) : db.payments[idx].reliability,
    description: description ?? db.payments[idx].description,
    updatedAt: new Date().toISOString(),
  };

  req.app.locals.writeVault(req.user.id, db);
  const updated = db.payments[idx];
  res.json({ ...updated, score: calcScore(updated) });
});

// DELETE /api/payments/:id
router.delete("/:id", authMiddleware, (req, res) => {
  const db = req.app.locals.readVault(req.user.id);
  const idx = db.payments.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Payment method not found" });
  db.payments.splice(idx, 1);
  req.app.locals.writeVault(req.user.id, db);
  res.json({ message: "Deleted successfully" });
});

// GET /api/payments/summary — LLM dashboard summary
router.get("/summary", authMiddleware, async (req, res) => {
  const db = req.app.locals.readVault(req.user.id);
  const items = db.payments.map((p) => ({ ...p, score: calcScore(p) }));

  if (items.length === 0) {
    return res.json({ summary: "No payment methods added yet." });
  }

  let summary = "Summary not available.";
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const payload = items.map(p => `${p.name} (Score: ${p.score}/10, Fee: ${p.fee}%)`).join(" | ");
      const prompt = `I am a user of an e-payments aggregator with these payment methods: ${payload}. Please provide a medium-length, intelligent summary analyzing my overall financial readiness. Keep it to approximately 3 highly concise sentences. Point out a major strength in my setup and an area for improvement or observation. Write back only the summary.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      summary = response.text;
    } catch(e) {
      console.error(e);
      summary = "AI generation unavailable.";
    }
  } else {
    summary = `You have ${items.length} payment methods stored. Your highest rated method is ${items.reduce((a, b) => (a.score > b.score ? a : b)).name}. (Add an API key to enable AI summaries)`;
  }
  
  res.json({ summary });
});

// POST /api/payments/compare — LLM textual compare
router.post("/compare", authMiddleware, async (req, res) => {
  const { ids, criteria } = req.body; 
  const db = req.app.locals.readVault(req.user.id);
  const items = db.payments
    .filter((p) => ids.includes(p.id))
    .map((p) => ({ ...p, score: calcScore(p) }));
    
  if (items.length === 0) return res.status(400).json({ message: "No items found" });

  let best = items.reduce((a, b) => (a.score > b.score ? a : b));
  let report = "Not compiled by LLM.";

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const payload = items.map(p => `Name: ${p.name}, Type: ${p.type}, Fee: ${p.fee}%, Security: ${p.security}/10, Speed: ${p.speed}/10, Score: ${p.score}/10`).join("\n");
      const prompt = `Act as an expert financial product analyst. I am providing you with data for several payment methods. Compare them intelligently and tell me which one is the absolute best for users to use, highlighting any caveats. Keep it concise, structured, and informative. \nData:\n${payload}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      report = response.text;
    } catch(e) {
      console.error(e);
      report = "LLM Generation failed - fallback to basic math score.";
    }
  } else {
    report = `Comparing ${items.length} items. Based on strict mathematics, ${best.name} is the best option with a score of ${best.score}/10. (No API Key provided for dynamic insight).`;
  }

  res.json({ methods: items, best, criteria, report });
});

module.exports = router;
