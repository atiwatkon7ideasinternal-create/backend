// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

// GET users
router.get("/", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// POST user
router.post("/", (req, res) => {
  const { name, email } = req.body;

  db.run(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [name, email],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ id: this.lastID, name, email });
    }
  );
});

module.exports = router;