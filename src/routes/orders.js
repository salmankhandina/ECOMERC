const express = require("express");
const { getPool } = require("../db");
const asyncHandler = require("../utils/async-handler");
const { recordOrderCreated } = require("../metrics");

const router = express.Router();

function makeError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeOrder(order) {
  return {
    id: order.id,
    customerName: order.customerName,
    email: order.email,
    address: order.address,
    totalAmount: Number(order.totalAmount),
    status: order.status,
    createdAt: order.createdAt,
    itemCount: Number(order.itemCount || 0)
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const sql = `
      SELECT
        o.id,
        o.customer_name AS customerName,
        o.email,
        o.address,
        o.total_amount AS totalAmount,
        o.status,
        o.created_at AS createdAt,
        COUNT(oi.id) AS itemCount
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY
        o.id,
        o.customer_name,
        o.email,
        o.address,
        o.total_amount,
        o.status,
        o.created_at
      ORDER BY o.created_at DESC
      LIMIT 6
    `;

    const [orders] = await getPool().query(sql);
    res.json({ orders: orders.map(normalizeOrder) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId < 1) {
      throw makeError("Invalid order id.", 400);
    }

    const [orders] = await getPool().execute(
      `
        SELECT
          id,
          customer_name AS customerName,
          email,
          address,
          total_amount AS totalAmount,
          status,
          created_at AS createdAt
        FROM orders
        WHERE id = ?
      `,
      [orderId]
    );

    if (!orders.length) {
      throw makeError("Order not found.", 404);
    }

    const [items] = await getPool().execute(
      `
        SELECT
          product_id AS productId,
          product_name AS productName,
          quantity,
          unit_price AS unitPrice,
          line_total AS lineTotal
        FROM order_items
        WHERE order_id = ?
        ORDER BY id
      `,
      [orderId]
    );

    res.json({
      order: {
        ...normalizeOrder(orders[0]),
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal)
        }))
      }
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const customerName = String(req.body.customerName || "").trim();
      const email = String(req.body.email || "").trim();
      const address = String(req.body.address || "").trim();
      const items = Array.isArray(req.body.items) ? req.body.items : [];

      if (!customerName || !email || !address) {
        throw makeError("Customer name, email, and address are required.", 400);
      }

      if (!email.includes("@")) {
        throw makeError("A valid email address is required.", 400);
      }

      if (!items.length) {
        throw makeError("Cart is empty.", 400);
      }

      const itemTotals = new Map();

      for (const rawItem of items) {
        const productId = Number(rawItem.productId);
        const quantity = Number(rawItem.quantity);

        if (!Number.isInteger(productId) || productId < 1) {
          throw makeError("Invalid product in cart.", 400);
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw makeError("Invalid quantity in cart.", 400);
        }

        itemTotals.set(productId, (itemTotals.get(productId) || 0) + quantity);
      }

      const normalizedItems = Array.from(itemTotals.entries()).map(
        ([productId, quantity]) => ({
          productId,
          quantity
        })
      );

      const productIds = normalizedItems.map((item) => item.productId);
      const placeholders = productIds.map(() => "?").join(", ");

      await connection.beginTransaction();

      const [products] = await connection.query(
        `
          SELECT
            id,
            name,
            price,
            inventory
          FROM products
          WHERE id IN (${placeholders}) AND is_active = 1
          FOR UPDATE
        `,
        productIds
      );

      const productMap = new Map(products.map((product) => [product.id, product]));
      const cartLines = [];
      let totalAmount = 0;

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw makeError(`Product ${item.productId} is not available.`, 400);
        }

        if (product.inventory < item.quantity) {
          throw makeError(
            `Only ${product.inventory} units available for ${product.name}.`,
            400
          );
        }

        const unitPrice = Number(product.price);
        const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
        totalAmount += lineTotal;

        cartLines.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          lineTotal
        });
      }

      const [orderResult] = await connection.execute(
        `
          INSERT INTO orders (customer_name, email, address, total_amount, status)
          VALUES (?, ?, ?, ?, ?)
        `,
        [customerName, email, address, Number(totalAmount.toFixed(2)), "confirmed"]
      );

      for (const line of cartLines) {
        await connection.execute(
          `
            INSERT INTO order_items
              (order_id, product_id, product_name, quantity, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            orderResult.insertId,
            line.productId,
            line.productName,
            line.quantity,
            line.unitPrice,
            line.lineTotal
          ]
        );

        await connection.execute(
          `
            UPDATE products
            SET inventory = inventory - ?
            WHERE id = ?
          `,
          [line.quantity, line.productId]
        );
      }

      await connection.commit();
      recordOrderCreated(
        Number(totalAmount.toFixed(2)),
        cartLines.reduce((sum, line) => sum + line.quantity, 0)
      );

      res.status(201).json({
        order: {
          id: orderResult.insertId,
          customerName,
          email,
          address,
          totalAmount: Number(totalAmount.toFixed(2)),
          status: "confirmed",
          createdAt: new Date().toISOString(),
          items: cartLines
        }
      });
    } catch (error) {
      await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  })
);

module.exports = router;
