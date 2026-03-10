import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Determine API base for Socket.IO - Use absolute URL for demo
  const socketUrl = useMemo(() => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5001';
  }, []);

  useEffect(() => {
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: false, // Set to false for wildcard CORS
      autoConnect: true,
      path: '/socket.io'
    });

    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
      // Join dashboard room for broadcast stats/alerts
      s.emit('join-dashboard', {});
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Generic handlers for alerts/incidents
    const onAlert = (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 200));
    };

    const onIncidentCreated = (incident) => {
      const mapped = {
        id: incident._id || incident.id,
        type: 'incident_created',
        severity: incident.severity || 'medium',
        message: incident.title || 'Sự cố mới',
        createdAt: incident.createdAt || new Date().toISOString()
      };
      setAlerts(prev => [mapped, ...prev].slice(0, 200));
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('alert', onAlert);
    s.on('incidentCreated', onIncidentCreated);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('alert', onAlert);
      s.off('incidentCreated', onIncidentCreated);
      s.disconnect();
    };
  }, [socketUrl]);

  const addAlert = (alert) => setAlerts(prev => [alert, ...prev].slice(0, 200));
  const removeAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  const value = {
    socket,
    isConnected,
    alerts,
    addAlert,
    removeAlert
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
