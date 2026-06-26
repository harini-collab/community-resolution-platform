import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io'
import { app } from './app.js';
import { connectWithRetry } from './config/db.js';
import { initSocket } from './socket.js';

dotenv.config();

const port = process.env.PORT || 5000;

// Bug fix: Wait for the database to be ready BEFORE starting the HTTP server.
// Original code started the server immediately; any request that hit the DB
// before Postgres was ready would throw an uncaught error and crash the process.
async function start() {
  try {
    await connectWithRetry();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim()),
        credentials: true
      }
    });

    initSocket(io);

    server.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
