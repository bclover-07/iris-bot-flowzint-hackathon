let io;

export function initSocketService(socketIo) {
  io = socketIo;
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    socket.on('join-session', (sessionId) => {
      console.log(`[Socket] Client ${socket.id} joined room: ${sessionId}`);
      socket.join(sessionId);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

export function emitRoutingEvent(sessionId, data) {
  if (io) {
    console.log(`[Socket] Emitting routing-event to room [${sessionId}]:`, data.message || data.type || data);
    io.to(sessionId).emit('routing-event', data);
  } else {
    console.warn(`[Socket] Warning: io is not initialized!`);
  }
}

export function emitBudgetUpdate(sessionId, data) {
  if (io) {
    console.log(`[Socket] Emitting budget-update to room [${sessionId}]`);
    io.to(sessionId).emit('budget-update', data);
  }
}
