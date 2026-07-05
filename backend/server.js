require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const socketService = require('./services/socketService');
const qdrantService = require('./services/qdrantService');
const aiAdapter = require('./services/aiAdapter');

// ── Connect to MongoDB ───────────────────────────────────
connectDB();

// ── Initialize Qdrant Vector Collections ─────────────────
qdrantService.initCollections()
  .then(() => console.log('✅ Qdrant collections initialized'))
  .catch(err => console.warn('⚠️  Qdrant not reachable on startup:', err.message));

// ── Log FastAPI AI Service Health ─────────────────────────
aiAdapter.checkHealth()
  .then(healthy => {
    if (healthy) console.log('✅ FastAPI AI service is online (port 8000)');
    else console.warn('⚠️  FastAPI AI service is offline. Run: backend/ai_service/start.ps1');
  });

const app = express();
const server = http.createServer(app);
socketService.init(server);

// ── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Root Route ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('<h1>Findit Backend API</h1><p>The backend is running successfully! Go to the frontend URL (usually http://localhost:5173) to view the app.</p>');
});

// ── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Findit API is running ✅', timestamp: new Date() });
});

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/lost-items', require('./routes/lostItemRoutes'));
app.use('/api/found-items', require('./routes/foundItemRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/recovery', require('./routes/recoveryRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// ── 404 handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ── Start server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
