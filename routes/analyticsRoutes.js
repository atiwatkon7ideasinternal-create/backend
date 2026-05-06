// routes/analyticsRoutes.js
// คำนวณจุดคุ้มทุน (Break-Even Point) และสรุปกำไร/ขาดทุน
//
// สูตรหลัก:
//   Contribution Margin ต่อหน่วย = ราคาขาย - ต้นทุนแปรผันต่อหน่วย
//   BEP (หน่วย)   = ต้นทุนคงที่รวม / Contribution Margin ต่อหน่วย
//   BEP (บาท)     = ต้นทุนคงที่รวม / (Contribution Margin / ราคาขาย)
//
// ต้นทุนแปรผันต่อหน่วย = ต้นทุนสินค้า (cost_price) + ต้นทุนแปรผันอื่น ๆ ที่ผูกกับสินค้านั้น

const express = require("express");
const router = express.Router();
const db = require("../db/db");

// GET /analytics/break-even/:productId
// คำนวณ BEP ของสินค้าแต่ละตัว
router.get("/break-even/:productId", (req, res) => {
  try {
    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(req.params.productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const fixedRow = db
      .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM fixed_costs")
      .get();
    const totalFixedCost = fixedRow.total;

    const variableRow = db
      .prepare(
        `SELECT COALESCE(SUM(amount_per_unit), 0) AS total
         FROM variable_costs
         WHERE product_id = ? OR product_id IS NULL`
      )
      .get(product.id);
    const extraVariablePerUnit = variableRow.total;
    const variableCostPerUnit = product.cost_price + extraVariablePerUnit;

    const sellingPrice = product.selling_price;
    const contributionMargin = sellingPrice - variableCostPerUnit;

    if (contributionMargin <= 0) {
      return res.json({
        product,
        total_fixed_cost: totalFixedCost,
        variable_cost_per_unit: variableCostPerUnit,
        selling_price: sellingPrice,
        contribution_margin_per_unit: contributionMargin,
        break_even_units: null,
        break_even_revenue: null,
        warning:
          "ราคาขายน้อยกว่าหรือเท่ากับต้นทุนแปรผันต่อหน่วย ทำให้ไม่สามารถคุ้มทุนได้",
      });
    }

    const breakEvenUnits = totalFixedCost / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * sellingPrice;
    const contributionMarginRatio = contributionMargin / sellingPrice;

    res.json({
      product,
      total_fixed_cost: totalFixedCost,
      variable_cost_per_unit: variableCostPerUnit,
      selling_price: sellingPrice,
      contribution_margin_per_unit: contributionMargin,
      contribution_margin_ratio: contributionMarginRatio,
      break_even_units: Math.ceil(breakEvenUnits),
      break_even_revenue: Math.round(breakEvenRevenue * 100) / 100,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /analytics/break-even
// คำนวณ BEP แบบกำหนดค่าเองโดยไม่ต้องผูกกับสินค้าในระบบ
router.post("/break-even", (req, res) => {
  const { fixed_cost, variable_cost_per_unit, selling_price } = req.body;
  if (
    fixed_cost == null ||
    variable_cost_per_unit == null ||
    selling_price == null
  ) {
    return res.status(400).json({
      error:
        "fixed_cost, variable_cost_per_unit, selling_price are required",
    });
  }
  const cm = selling_price - variable_cost_per_unit;
  if (cm <= 0) {
    return res.json({
      fixed_cost,
      variable_cost_per_unit,
      selling_price,
      contribution_margin_per_unit: cm,
      break_even_units: null,
      break_even_revenue: null,
      warning: "ราคาขาย <= ต้นทุนแปรผัน ไม่สามารถคุ้มทุนได้",
    });
  }
  const units = fixed_cost / cm;
  res.json({
    fixed_cost,
    variable_cost_per_unit,
    selling_price,
    contribution_margin_per_unit: cm,
    contribution_margin_ratio: cm / selling_price,
    break_even_units: Math.ceil(units),
    break_even_revenue: Math.round(units * selling_price * 100) / 100,
  });
});

// GET /analytics/summary
// สรุปยอดขาย ต้นทุน กำไร/ขาดทุน
router.get("/summary", (req, res) => {
  try {
    const sales = db
      .prepare(
        `SELECT
           COALESCE(SUM(total), 0) AS revenue,
           COALESCE(SUM(quantity * unit_cost), 0) AS cogs,
           COALESCE(SUM(quantity), 0) AS units_sold
         FROM sales`
      )
      .get();

    const fixed = db
      .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM fixed_costs")
      .get();

    const extraVar = db
      .prepare(
        `SELECT COALESCE(SUM(s.quantity * COALESCE(vc.per_unit, 0)), 0) AS total
         FROM sales s
         LEFT JOIN (
           SELECT product_id, SUM(amount_per_unit) AS per_unit
           FROM variable_costs
           GROUP BY product_id
         ) vc ON vc.product_id = s.product_id OR vc.product_id IS NULL`
      )
      .get();

    const revenue = sales.revenue;
    const cogs = sales.cogs;
    const totalFixed = fixed.total;
    const totalExtraVariable = extraVar.total;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalFixed - totalExtraVariable;

    res.json({
      units_sold: sales.units_sold,
      revenue,
      cogs,
      gross_profit: grossProfit,
      total_fixed_cost: totalFixed,
      total_extra_variable_cost: totalExtraVariable,
      net_profit: netProfit,
      status: netProfit >= 0 ? "กำไร" : "ขาดทุน",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
