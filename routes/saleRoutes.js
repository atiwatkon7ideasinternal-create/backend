// routes/saleRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  const sql = `
    SELECT s.*, pr.name AS product_name
    FROM sales s
    LEFT JOIN products pr ON pr.id = s.product_id
    ORDER BY s.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// บันทึกการขาย: ตัดสต็อก และเก็บ unit_cost ขณะขาย เพื่อคำนวณกำไรย้อนหลังได้แม่น
router.post("/", (req, res) => {
  const { product_id, quantity, unit_price } = req.body;
  if (!product_id || !quantity || unit_price == null) {
    return res
      .status(400)
      .json({ error: "product_id, quantity, unit_price are required" });
  }

  db.get(
    "SELECT * FROM products WHERE id = ?",
    [product_id],
    (err, product) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!product) return res.status(404).json({ error: "Product not found" });
      if (product.stock < quantity) {
        return res.status(400).json({
          error: `สต็อกไม่พอ มี ${product.stock} แต่ต้องการ ${quantity}`,
        });
      }

      const unit_cost = product.cost_price;
      const total = quantity * unit_price;

      db.serialize(() => {
        db.run(
          `INSERT INTO sales (product_id, quantity, unit_price, unit_cost, total)
           VALUES (?, ?, ?, ?, ?)`,
          [product_id, quantity, unit_price, unit_cost, total],
          function (err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            const saleId = this.lastID;
            db.run(
              "UPDATE products SET stock = stock - ? WHERE id = ?",
              [quantity, product_id],
              function (err3) {
                if (err3) return res.status(500).json({ error: err3.message });
                res.json({
                  id: saleId,
                  product_id,
                  quantity,
                  unit_price,
                  unit_cost,
                  total,
                  profit: (unit_price - unit_cost) * quantity,
                });
              }
            );
          }
        );
      });
    }
  );
});

router.delete("/:id", (req, res) => {
  db.get("SELECT * FROM sales WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Sale not found" });

    db.serialize(() => {
      db.run("UPDATE products SET stock = stock + ? WHERE id = ?", [
        row.quantity,
        row.product_id,
      ]);
      db.run(
        "DELETE FROM sales WHERE id = ?",
        [req.params.id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ deleted: this.changes });
        }
      );
    });
  });
});

module.exports = router;
