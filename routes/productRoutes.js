// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  db.all("SELECT * FROM products ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get("/:id", (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Product not found" });
    res.json(row);
  });
});

router.post("/", (req, res) => {
  const { name, sku, cost_price, selling_price, stock } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  db.run(
    `INSERT INTO products (name, sku, cost_price, selling_price, stock)
     VALUES (?, ?, ?, ?, ?)`,
    [name, sku || null, cost_price || 0, selling_price || 0, stock || 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: this.lastID,
        name,
        sku,
        cost_price,
        selling_price,
        stock,
      });
    }
  );
});

router.put("/:id", (req, res) => {
  const { name, sku, cost_price, selling_price, stock } = req.body;
  db.run(
    `UPDATE products
     SET name = COALESCE(?, name),
         sku = COALESCE(?, sku),
         cost_price = COALESCE(?, cost_price),
         selling_price = COALESCE(?, selling_price),
         stock = COALESCE(?, stock)
     WHERE id = ?`,
    [name, sku, cost_price, selling_price, stock, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Product not found" });
      res.json({ updated: this.changes });
    }
  );
});

router.delete("/:id", (req, res) => {
  db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
