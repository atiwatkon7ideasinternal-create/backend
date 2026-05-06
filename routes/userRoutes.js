// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM users").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", (req, res) => {
  const { name, email } = req.body;
  try {
    const result = db
      .prepare("INSERT INTO users (name, email) VALUES (?, ?)")
      .run(name ?? null, email ?? null);
    res.json({ id: result.lastInsertRowid, name, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
