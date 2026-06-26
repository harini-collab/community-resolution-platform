import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

// Bug fix 1: Wrapped localStorage.getItem in a try/catch.
// If localStorage.user is "undefined" (a string), null, or partial JSON from a
// crashed write, JSON.parse throws a SyntaxError and the entire React tree
// unmounts with a white screen. This guard clears the corrupt value and returns null.
function safeParseUser() {
  try {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(safeParseUser);
  const [socket, setSocket] = useState(null);

  // Bug fix 2: Verify the stored token with the server on every page load.
  // Original code trusted localStorage.user without consulting the server.
  // If the JWT_SECRET was rotated or the user was deleted, the frontend would
  // still show the user as logged in while every API call returned 401.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {
        // 401 interceptor in client.js clears storage; just reset local state.
        setUser(null);
      });
  }, []);

  // Bug fix 3: Socket useEffect depended on the entire user object, causing a new
  // socket connection every time any user field changed (e.g. a re-render with a
  // new object reference). Changed dependency to user?.id so the socket is only
  // recreated when the logged-in user actually changes.
  useEffect(() => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const nextSocket = io(socketUrl);
    nextSocket.emit('join:user', user.id);
    if (user.role === 'admin') nextSocket.emit('join:admins');
    if (user.department_id) nextSocket.emit('join:department', user.department_id);
    setSocket(nextSocket);
    return () => nextSocket.disconnect();
  }, [user?.id]);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    socket?.disconnect();
    setSocket(null);
  }

  const value = useMemo(
    () => ({ user, socket, login, register, logout }),
    [user, socket]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
