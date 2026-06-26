import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Bug fix: Added server.proxy so the Vite dev server forwards /api/* and /socket.io
// to the backend. Without this, the browser made cross-origin requests directly to
// localhost:5000, which hit pre-flight CORS handling (see app.js fix) and also
// failed entirely inside Docker because the container's localhost:5000 is not
// the same as the host's localhost:5000.
// With the proxy in place, the frontend uses a relative baseURL (/api) and Vite
// handles the forwarding in dev; in production the same relative URL works if
// the app is served from the same origin as the API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // needed for Docker
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  }
});
