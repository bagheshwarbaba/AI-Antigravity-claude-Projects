const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "epayment_super_secret_key_2024";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (!/\d/.test(password))
      return res.status(400).json({ message: "Password must contain at least one number" });

    const db = req.app.locals.readUsers();
    const exists = db.users.find((u) => u.email === email.toLowerCase());
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = {
      id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    req.app.locals.writeUsers(db);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      message: "Registration successful",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const db = req.app.locals.readUsers();
    const user = db.users.find((u) => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = req.app.locals.readUsers();
    const user = db.users.find((u) => u.id === decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
