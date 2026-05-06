// routes/purchaseRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT p.*, pr.name AS product_name
         FROM purchases p
         LEFT JOIN products pr ON pr.id = p.product_id
         ORDER BY p.id DESC`
      )
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const insertPurchase = db.transaction(
  ({ product_id, quantity, unit_cost, total }) => {
    const result = db
      .prepare(
        `INSERT INTO purchases (product_id, quantity, unit_cost, total)
         VALUES (?, ?, ?, ?)`
      )
      .run(product_id, quantity, unit_cost, total);
    db.prepare(
      `UPDATE products
       SET stock = stock + ?, cost_price = ?
       WHERE id = ?`
    ).run(quantity, unit_cost, product_id);
    return result.lastInsertRowid;
  }
);

// บันทึกซื้อสินค้า: เพิ่มสต็อก และอัปเดต cost_price ล่าสุดของสินค้านั้น
router.post("/", (req, res) => {
  const { product_id, quantity, unit_cost } = req.body;
  if (!product_id || !quantity || unit_cost == null) {
    return res
      .status(400)
      .json({ error: "product_id, quantity, unit_cost are required" });
  }

  const total = quantity * unit_cost;
  try {
    const id = insertPurchase({ product_id, quantity, unit_cost, total });
    res.json({ id, product_id, quantity, unit_cost, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const deletePurchaseTx = db.transaction((id) => {
  const row = db.prepare("SELECT * FROM purchases WHERE id = ?").get(id);
  if (!row) return { notFound: true };
  db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(
    row.quantity,
    row.product_id
  );
  const result = db.prepare("DELETE FROM purchases WHERE id = ?").run(id);
  return { changes: result.changes };
});

router.delete("/:id", (req, res) => {
  try {
    const result = deletePurchaseTx(req.params.id);
    if (result.notFound)
      return res.status(404).json({ error: "Purchase not found" });
    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
