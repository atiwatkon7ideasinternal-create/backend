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
  try {
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", (req, res) => {
  const { name, amount_per_unit, product_id, note } = req.body;
  if (!name || amount_per_unit == null) {
    return res
      .status(400)
      .json({ error: "name and amount_per_unit are required" });
  }
  try {
    const result = db
      .prepare(
        `INSERT INTO variable_costs (name, amount_per_unit, product_id, note)
         VALUES (?, ?, ?, ?)`
      )
      .run(name, amount_per_unit, product_id || null, note || null);
    res.json({
      id: result.lastInsertRowid,
      name,
      amount_per_unit,
      product_id,
      note,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { name, amount_per_unit, product_id, note } = req.body;
  try {
    const result = db
      .prepare(
        `UPDATE variable_costs
         SET name = COALESCE(?, name),
             amount_per_unit = COALESCE(?, amount_per_unit),
             product_id = COALESCE(?, product_id),
             note = COALESCE(?, note)
         WHERE id = ?`
      )
      .run(
        name ?? null,
        amount_per_unit ?? null,
        product_id ?? null,
        note ?? null,
        req.params.id
      );
    if (result.changes === 0)
      return res.status(404).json({ error: "Variable cost not found" });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const result = db
      .prepare("DELETE FROM variable_costs WHERE id = ?")
      .run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
