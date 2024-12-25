import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', socket => {
      console.log('Socket Connected:', socket.id);
      
      socket.on('sdp', data => {
        console.log('SDP from:', socket.id, 'to:', data.targetId);
        socket.to(data.targetId).emit('sdp', {
          ...data,
          sourceId: socket.id
        });
      });

      socket.on('ice-candidate', data => {
        console.log('ICE from:', socket.id, 'to:', data.targetId);
        socket.to(data.targetId).emit('ice-candidate', {
          ...data,
          sourceId: socket.id
        });
      });

      socket.on('disconnect', () => {
        console.log('Socket Disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default SocketHandler;