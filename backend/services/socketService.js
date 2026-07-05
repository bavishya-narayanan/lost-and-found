const jwt = require('jsonwebtoken');
const authHelper = require('../utils/authHelper');
const chatService = require('./chatService');

let io;

exports.init = (httpServer) => {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;

      const sessionId = socket.handshake.query.sessionId;
      if (!sessionId) return next(new Error('Session ID required'));

      const isParticipant = await authHelper.isParticipantInSession(decoded.id, sessionId);
      if (!isParticipant) return next(new Error('Unauthorized for this session'));

      socket.sessionId = sessionId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} to session ${socket.sessionId}`);
    
    socket.join(socket.sessionId);

    socket.on('send_message', async (data) => {
      try {
        const message = await chatService.saveMessage(
          socket.sessionId,
          socket.user.id,
          data.receiverId,
          'text',
          data.content
        );
        
        io.to(socket.sessionId).emit('receive_message', message);
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    socket.on('meeting-location:set', async (locationData) => {
      try {
        const RecoverySession = require('../models/RecoverySession');
        const campusZoneService = require('./campusZoneService');

        const session = await RecoverySession.findById(socket.sessionId);
        if (!session) return;
        
        // Only the finder can set the location
        if (session.finder.toString() !== socket.user.id) {
            console.error('Unauthorized attempt to set meeting location by user', socket.user.id);
            return;
        }

        const campusZone = campusZoneService.getCampusZone(locationData.latitude, locationData.longitude);

        session.meetingLocation = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            campusZone: campusZone,
            landmark: locationData.landmark || session.meetingLocation?.landmark,
            selectedBy: locationData.selectedBy || 'MAP'
        };
        session.meetingLocationUpdatedAt = new Date();
        await session.save();

        io.to(socket.sessionId).emit('meeting-location:updated', {
            meetingLocation: session.meetingLocation,
            meetingLocationUpdatedAt: session.meetingLocationUpdatedAt
        });
      } catch (error) {
        console.error('Socket meeting-location error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};

exports.getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
