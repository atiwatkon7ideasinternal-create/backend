// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM products ORDER BY id DESC").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const row = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(req.params.id);
    if (!row) return res.status(404).json({ error: "Product not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", (req, res) => {
  const { name, sku, cost_price, selling_price, stock } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  try {
    const result = db
      .prepare(
        `INSERT INTO products (name, sku, cost_price, selling_price, stock)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        name,
        sku || null,
        cost_price || 0,
        selling_price || 0,
        stock || 0
      );
    res.json({
      id: result.lastInsertRowid,
      name,
      sku,
      cost_price,
      selling_price,
      stock,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { name, sku, cost_price, selling_price, stock } = req.body;
  try {
    const result = db
      .prepare(
        `UPDATE products
         SET name = COALESCE(?, name),
             sku = COALESCE(?, sku),
             cost_price = COALESCE(?, cost_price),
             selling_price = COALESCE(?, selling_price),
             stock = COALESCE(?, stock)
         WHERE id = ?`
      )
      .run(
        name ?? null,
        sku ?? null,
        cost_price ?? null,
        selling_price ?? null,
        stock ?? null,
        req.params.id
      );
    if (result.changes === 0)
      return res.status(404).json({ error: "Product not found" });
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const result = db
      .prepare("DELETE FROM products WHERE id = ?")
      .run(req.params.id);
    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
