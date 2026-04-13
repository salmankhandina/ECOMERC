const app = require("./app");
const config = require("./config");
const { connectWithRetry, ensureSchema } = require("./db");

async function start() {
  await connectWithRetry();
  await ensureSchema();

  app.listen(config.port, () => {
    console.log(`Storefront app listening on port ${config.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
