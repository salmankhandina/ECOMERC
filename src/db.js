const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");
const config = require("./config");

let pool;

function getPool() {
  if (!pool) {
    throw new Error("Database pool has not been initialized.");
  }

  return pool;
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry() {
  const maxAttempts = 20;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      pool = mysql.createPool(config.db);
      await pool.query("SELECT 1");
      return pool;
    } catch (error) {
      lastError = error;
      if (pool) {
        await pool.end().catch(() => {});
        pool = undefined;
      }

      console.warn(
        `Database connection attempt ${attempt}/${maxAttempts} failed: ${error.message}`
      );
      await wait(2000);
    }
  }

  throw lastError;
}

async function ensureSchema() {
  if (!config.initSchema) {
    return;
  }

  const sqlPath = path.join(__dirname, "db", "init.sql");
  const sql = await fs.readFile(sqlPath, "utf8");
  await getPool().query(sql);
}

module.exports = {
  connectWithRetry,
  ensureSchema,
  getPool
};
