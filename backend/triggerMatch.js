require('dotenv').config();
const mongoose = require('mongoose');
const LostItem = require('./models/LostItem');
const matchingService = require('./services/matchingService');

async function trigger() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lost-and-found');
  const items = await LostItem.find();
  for (const item of items) {
    await matchingService.findMatches(item, 'lost');
  }
  console.log('Finished manual matching trigger');
  process.exit(0);
}

trigger();
