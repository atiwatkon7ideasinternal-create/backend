// routes/purchaseRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  const sql = `
    SELECT p.*, pr.name AS product_name
    FROM purchases p
    LEFT JOIN products pr ON pr.id = p.product_id
    ORDER BY p.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// บันทึกซื้อสินค้า: เพิ่มสต็อก และอัปเดต cost_price ล่าสุดของสินค้านั้น
router.post("/", (req, res) => {
  const { product_id, quantity, unit_cost } = req.body;
  if (!product_id || !quantity || unit_cost == null) {
    return res
      .status(400)
      .json({ error: "product_id, quantity, unit_cost are required" });
  }

  const total = quantity * unit_cost;

  db.serialize(() => {
    db.run(
      `INSERT INTO purchases (product_id, quantity, unit_cost, total)
       VALUES (?, ?, ?, ?)`,
      [product_id, quantity, unit_cost, total],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const purchaseId = this.lastID;
        db.run(
          `UPDATE products
           SET stock = stock + ?, cost_price = ?
           WHERE id = ?`,
          [quantity, unit_cost, product_id],
          function (err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({
              id: purchaseId,
              product_id,
              quantity,
              unit_cost,
              total,
            });
          }
        );
      }
    );
  });
});

router.delete("/:id", (req, res) => {
  db.get(
    "SELECT * FROM purchases WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Purchase not found" });

      db.serialize(() => {
        db.run(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [row.quantity, row.product_id]
        );
        db.run(
          "DELETE FROM purchases WHERE id = ?",
          [req.params.id],
          function (err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ deleted: this.changes });
          }
        );
      });
    }
  );
});

module.exports = router;
