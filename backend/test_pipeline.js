const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const LostItem = require('./models/LostItem');
const FoundItem = require('./models/FoundItem');
const Match = require('./models/Match');
const aiOrchestrator = require('./services/aiOrchestrator');
const aiAdapter = require('./services/aiAdapter');
const qdrantService = require('./services/qdrantService');

const runTest = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected.");
        
        console.log("Fetching a Lost Report to test the pipeline...");
        const lost = new LostItem({
            title: "Black Scientific Calculator",
            category: "Electronics",
            description: "Casio scientific calculator fx-991EX",
            locationLost: "Main Library",
            dateLost: new Date(),
            image: "/uploads/image-1782373871327-804577762.jpeg",
            reportedBy: new mongoose.Types.ObjectId()
        });
        await lost.save();
        console.log(`Saved dummy lost report: ${lost._id}`);
        
        console.log("Running AI Orchestrator for Lost Item...");
        await aiOrchestrator.processAndMatchReport(lost, 'lost');

        console.log("Fetching a Found Report to test the pipeline...");
        const found = new FoundItem({
            title: "Dark Scientific Calculator",
            category: "Electronics",
            description: "A casio calculator fx-991EX found near a desk",
            locationFound: "Main Library",
            dateFound: new Date(),
            custodyType: "holding",
            image: "/uploads/image-1782373871327-804577762.jpeg",
            reportedBy: new mongoose.Types.ObjectId()
        });
        await found.save();
        console.log(`Saved dummy found report: ${found._id}`);
        
        console.log("Running AI Orchestrator for Found Item...");
        await aiOrchestrator.processAndMatchReport(found, 'found');
        
        console.log("Checking for Matches...");
        const matches = await Match.find({ lostItem: lost._id, foundItem: found._id });
        if (matches.length > 0) {
            console.log(`✅ SUCCESS! Found ${matches.length} match(es).`);
            console.log(JSON.stringify(matches, null, 2));
        } else {
            console.log(`❌ FAILURE! No matches were created.`);
        }

        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

runTest();
