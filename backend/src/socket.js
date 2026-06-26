let ioInstance;

export function initSocket(io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    socket.on('join:user', (userId) => socket.join(`user:${userId}`));
    socket.on('join:department', (departmentId) => socket.join(`department:${departmentId}`));
    socket.on('join:admins', () => socket.join('admins'));
  });
}

export function emitIssueUpdate(issue) {
  if (!ioInstance) return;
  ioInstance.to('admins').emit('issue:updated', issue);
  if (issue.created_by) ioInstance.to(`user:${issue.created_by}`).emit('issue:updated', issue);
  if (issue.assigned_department) {
    ioInstance.to(`department:${issue.assigned_department}`).emit('issue:updated', issue);
  }
}

export function emitNotification(userId, notification) {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit('notification:new', notification);
}
