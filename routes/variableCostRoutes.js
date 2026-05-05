// routes/variableCostRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

// ต้นทุนแปรผันต่อหน่วย เช่น ค่าขนส่งต่อชิ้น, ค่าบรรจุภัณฑ์ต่อชิ้น
// ถ้าระบุ product_id จะผูกกับสินค้าใดสินค้าหนึ่ง ถ้าเว้น = ใช้กับทุกสินค้า

router.get("/", (req, res) => {
  const { product_id } = req.query;
  let sql = "SELECT * FROM variable_costs";
  const params = [];
  if (product_id) {
    sql += " WHERE product_id = ? OR product_id IS NULL";
    params.push(product_id);
  }
  sql += " ORDER BY id DESC";
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post("/", (req, res) => {
  const { name, amount_per_unit, product_id, note } = req.body;
  if (!name || amount_per_unit == null) {
    return res
      .status(400)
      .json({ error: "name and amount_per_unit are required" });
  }
  db.run(
    `INSERT INTO variable_costs (name, amount_per_unit, product_id, note)
     VALUES (?, ?, ?, ?)`,
    [name, amount_per_unit, product_id || null, note || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        name,
        amount_per_unit,
        product_id,
        note,
      });
    }
  );
});

router.put("/:id", (req, res) => {
  const { name, amount_per_unit, product_id, note } = req.body;
  db.run(
    `UPDATE variable_costs
     SET name = COALESCE(?, name),
         amount_per_unit = COALESCE(?, amount_per_unit),
         product_id = COALESCE(?, product_id),
         note = COALESCE(?, note)
     WHERE id = ?`,
    [name, amount_per_unit, product_id, note, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Variable cost not found" });
      res.json({ updated: this.changes });
    }
  );
});

router.delete("/:id", (req, res) => {
  db.run(
    "DELETE FROM variable_costs WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});

module.exports = router;
