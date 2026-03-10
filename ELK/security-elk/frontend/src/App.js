import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import './utils/axiosConfig'; // Import cấu hình Axios
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Alerts from './pages/Alerts';
import Users from './pages/Users';
import Settings from './pages/Settings';
import './App.css';

// Tạo React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 phút
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="incidents" element={<Incidents />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="users" element={<Users />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10B981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
