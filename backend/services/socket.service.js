let io;

export function initSocketService(socketIo) {
  io = socketIo;
  io.on('connection', (socket) => {
    socket.on('join-session', (sessionId) => {
      socket.join(sessionId);
    });
  });
}

export function emitRoutingEvent(sessionId, data) {
  if (io) {
    io.to(sessionId).emit('routing-event', data);
  }
}

export function emitBudgetUpdate(sessionId, data) {
  if (io) {
    io.to(sessionId).emit('budget-update', data);
  }
}
