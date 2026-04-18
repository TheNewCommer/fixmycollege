import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const on = (event, cb) => socketRef.current?.on(event, cb);
  const off = (event, cb) => socketRef.current?.off(event, cb);

  return (
    <SocketContext.Provider value={{ connected, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
