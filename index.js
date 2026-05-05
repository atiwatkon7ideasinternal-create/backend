// index.js
const express = require("express");
const cors = require("cors");

const app = express();

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const saleRoutes = require("./routes/saleRoutes");
const fixedCostRoutes = require("./routes/fixedCostRoutes");
const variableCostRoutes = require("./routes/variableCostRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/purchases", purchaseRoutes);
app.use("/sales", saleRoutes);
app.use("/fixed-costs", fixedCostRoutes);
app.use("/variable-costs", variableCostRoutes);
app.use("/analytics", analyticsRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
