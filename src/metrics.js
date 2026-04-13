const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "storefront_"
});

const httpRequestsTotal = new client.Counter({
  name: "storefront_http_requests_total",
  help: "Total number of HTTP requests handled by the app.",
  labelNames: ["method", "route", "status_code"],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "storefront_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds.",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register]
});

const ordersCreatedTotal = new client.Counter({
  name: "storefront_orders_created_total",
  help: "Number of successfully created orders.",
  registers: [register]
});

const orderRevenueTotal = new client.Counter({
  name: "storefront_order_revenue_total",
  help: "Total revenue captured by successful orders.",
  registers: [register]
});

const orderItemsTotal = new client.Counter({
  name: "storefront_order_items_total",
  help: "Total number of items sold through successful orders.",
  registers: [register]
});

function getRouteLabel(req) {
  if (req.baseUrl && req.route && req.route.path) {
    return `${req.baseUrl}${req.route.path}`;
  }

  if (req.route && req.route.path) {
    return req.route.path;
  }

  if (req.path) {
    return req.path;
  }

  return "unknown";
}

function metricsMiddleware(req, res, next) {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = {
      method: req.method,
      route: getRouteLabel(req),
      status_code: String(res.statusCode)
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}

function recordOrderCreated(totalAmount, totalItems) {
  ordersCreatedTotal.inc();
  orderRevenueTotal.inc(Number(totalAmount) || 0);
  orderItemsTotal.inc(Number(totalItems) || 0);
}

module.exports = {
  register,
  metricsMiddleware,
  recordOrderCreated
};
