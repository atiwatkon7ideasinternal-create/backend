// routes/saleRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT s.*, pr.name AS product_name
         FROM sales s
         LEFT JOIN products pr ON pr.id = s.product_id
         ORDER BY s.id DESC`
      )
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const insertSaleTx = db.transaction(({ product, quantity, unit_price }) => {
  const unit_cost = product.cost_price;
  const total = quantity * unit_price;
  const result = db
    .prepare(
      `INSERT INTO sales (product_id, quantity, unit_price, unit_cost, total)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(product.id, quantity, unit_price, unit_cost, total);
  db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(
    quantity,
    product.id
  );
  return { id: result.lastInsertRowid, unit_cost, total };
});

// บันทึกการขาย: ตัดสต็อก และเก็บ unit_cost ขณะขาย เพื่อคำนวณกำไรย้อนหลังได้แม่น
router.post("/", (req, res) => {
  const { product_id, quantity, unit_price } = req.body;
  if (!product_id || !quantity || unit_price == null) {
    return res
      .status(400)
      .json({ error: "product_id, quantity, unit_price are required" });
  }

  try {
    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(product_id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.stock < quantity) {
      return res.status(400).json({
        error: `สต็อกไม่พอ มี ${product.stock} แต่ต้องการ ${quantity}`,
      });
    }

    const { id, unit_cost, total } = insertSaleTx({
      product,
      quantity,
      unit_price,
    });
    res.json({
      id,
      product_id,
      quantity,
      unit_price,
      unit_cost,
      total,
      profit: (unit_price - unit_cost) * quantity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const deleteSaleTx = db.transaction((id) => {
  const row = db.prepare("SELECT * FROM sales WHERE id = ?").get(id);
  if (!row) return { notFound: true };
  db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(
    row.quantity,
    row.product_id
  );
  const result = db.prepare("DELETE FROM sales WHERE id = ?").run(id);
  return { changes: result.changes };
});

router.delete("/:id", (req, res) => {
  try {
    const result = deleteSaleTx(req.params.id);
    if (result.notFound)
      return res.status(404).json({ error: "Sale not found" });
    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
