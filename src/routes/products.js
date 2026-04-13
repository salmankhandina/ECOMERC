const express = require("express");
const { getPool } = require("../db");
const asyncHandler = require("../utils/async-handler");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "all").trim();
    const filters = ["is_active = 1"];
    const params = [];

    if (category && category !== "all") {
      filters.push("category = ?");
      params.push(category);
    }

    if (search) {
      filters.push("(name LIKE ? OR short_description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const productSql = `
      SELECT
        id,
        name,
        category,
        price,
        short_description AS shortDescription,
        image_url AS imageUrl,
        inventory
      FROM products
      ${whereClause}
      ORDER BY category, name
    `;

    const categorySql = `
      SELECT DISTINCT category
      FROM products
      WHERE is_active = 1
      ORDER BY category
    `;

    const [products] = await getPool().execute(productSql, params);
    const [categories] = await getPool().query(categorySql);

    res.json({
      products,
      categories: categories.map((row) => row.category)
    });
  })
);

module.exports = router;
