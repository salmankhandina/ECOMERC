const express = require("express");
const asyncHandler = require("../utils/async-handler");
const { register } = require("../metrics");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.send(await register.metrics());
  })
);

module.exports = router;
