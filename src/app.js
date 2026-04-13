const express = require("express");
const morgan = require("morgan");
const path = require("path");

const healthRoutes = require("./routes/health");
const metricsRoutes = require("./routes/metrics");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const { metricsMiddleware } = require("./metrics");

const app = express();
const publicDir = path.join(__dirname, "..", "public");

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(metricsMiddleware);
app.use(express.static(publicDir));

app.use("/api/health", healthRoutes);
app.use("/metrics", metricsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    next(err);
    return;
  }

  const status = err.status || 500;
  const message = err.message || "Internal server error";

  if (req.path.startsWith("/api/")) {
    res.status(status).json({ error: message });
    return;
  }

  res.status(status).send(message);
});

module.exports = app;
