const express = require("express");
const { getPool } = require("../db");
const asyncHandler = require("../utils/async-handler");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    await getPool().query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  })
);

module.exports = router;
