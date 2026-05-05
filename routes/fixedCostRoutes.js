// routes/fixedCostRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  db.all("SELECT * FROM fixed_costs ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/", (req, res) => {
  const { name, amount, period, note } = req.body;
  if (!name || amount == null) {
    return res.status(400).json({ error: "name and amount are required" });
  }
  db.run(
    `INSERT INTO fixed_costs (name, amount, period, note)
     VALUES (?, ?, ?, ?)`,
    [name, amount, period || "monthly", note || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, amount, period, note });
    }
  );
});

router.put("/:id", (req, res) => {
  const { name, amount, period, note } = req.body;
  db.run(
    `UPDATE fixed_costs
     SET name = COALESCE(?, name),
         amount = COALESCE(?, amount),
         period = COALESCE(?, period),
         note = COALESCE(?, note)
     WHERE id = ?`,
    [name, amount, period, note, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Fixed cost not found" });
      res.json({ updated: this.changes });
    }
  );
});

router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM fixed_costs WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});

module.exports = router;
