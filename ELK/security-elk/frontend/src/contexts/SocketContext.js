import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useLocalization } from './LocalizationContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { t } = useLocalization();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const socketUrl = useMemo(() => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5001';
  }, []);

  useEffect(() => {
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: false,
      autoConnect: true,
      path: '/socket.io'
    });

    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
      s.emit('join-dashboard', {});
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 200));
    };

    const onIncidentCreated = (incident) => {
      const mapped = {
        id: incident._id || incident.id,
        type: 'incident_created',
        severity: incident.severity || 'medium',
        message: incident.title || t('socket.newIncident'),
        createdAt: incident.createdAt || new Date().toISOString()
      };
      setAlerts((prev) => [mapped, ...prev].slice(0, 200));
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
  }, [socketUrl, t]);

  const addAlert = (alert) => setAlerts((prev) => [alert, ...prev].slice(0, 200));
  const removeAlert = (id) => setAlerts((prev) => prev.filter((alert) => alert.id !== id));

  const value = {
    socket,
    isConnected,
    alerts,
    addAlert,
    removeAlert
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
