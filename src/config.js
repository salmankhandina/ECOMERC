const dotenv = require("dotenv");

dotenv.config({ override: true });

const config = {
  port: Number(process.env.PORT || 3000),
  initSchema: String(process.env.INIT_SCHEMA || "true").toLowerCase() === "true",
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "storefront",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    waitForConnections: true,
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true
  }
};

module.exports = config;
