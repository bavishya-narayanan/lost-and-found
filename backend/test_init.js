const qdrantService = require('./services/qdrantService');
const aiAdapter = require('./services/aiAdapter');

async function test() {
  console.log("Checking FastAPI health...");
  const apiHealthy = await aiAdapter.checkHealth();
  console.log("FastAPI healthy:", apiHealthy);

  console.log("Initializing Qdrant collections...");
  await qdrantService.initCollections();
  console.log("Qdrant initialization complete.");
  process.exit(0);
}
test();
