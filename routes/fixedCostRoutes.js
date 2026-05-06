// routes/fixedCostRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM fixed_costs ORDER BY id DESC")
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", (req, res) => {
  const { name, amount, period, note } = req.body;
  if (!name || amount == null) {
    return res.status(400).json({ error: "name and amount are required" });
  }
  try {
    const result = db
      .prepare(
        `INSERT INTO fixed_costs (name, amount, period, note)
         VALUES (?, ?, ?, ?)`
      )
      .run(name, amount, period || "monthly", note || null);
    res.json({ id: result.lastInsertRowid, name, amount, period, note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { name, amount, period, note } = req.body;
  try {
    const result = db
      .prepare(
        `UPDATE fixed_costs
         SET name = COALESCE(?, name),
             amount = COALESCE(?, amount),
             period = COALESCE(?, period),
             note = COALESCE(?, note)
         WHERE id = ?`
      )
      .run(
        name ?? null,
        amount ?? null,
        period ?? null,
        note ?? null,
        req.params.id
      );
    if (result.changes === 0)
      return res.status(404).json({ error: "Fixed cost not found" });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const result = db
      .prepare("DELETE FROM fixed_costs WHERE id = ?")
      .run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
