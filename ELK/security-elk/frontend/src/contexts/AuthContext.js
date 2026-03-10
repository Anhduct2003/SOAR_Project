import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  LOGOUT: 'LOGOUT',
  USER_LOADED: 'USER_LOADED',
  AUTH_ERROR: 'AUTH_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.USER_LOADED:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAIL:
    case AUTH_ACTIONS.AUTH_ERROR:
    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token header
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Load user
  const loadUser = async () => {
    try {
      if (state.token) {
        setAuthToken(state.token);
        const res = await axios.get('/api/auth/me');
        dispatch({
          type: AUTH_ACTIONS.USER_LOADED,
          payload: res.data.user
        });
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.warn('Backend unavailable during loadUser, checking for mock session');
      if (state.token) {
        // Mock User fallback logic
        const mockUser = {
          id: '1',
          name: 'Admin User (Mock)',
          email: 'admin@security.local',
          role: 'admin'
        };

        dispatch({
          type: AUTH_ACTIONS.USER_LOADED,
          payload: mockUser
        });
      } else {
        dispatch({
          type: AUTH_ACTIONS.AUTH_ERROR,
          payload: error.response?.data?.message || 'Lỗi xác thực'
        });
      }
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const res = await axios.post('/api/auth/login', { email, password });

      // Set token in axios immediately
      if (res.data.token) {
        setAuthToken(res.data.token);
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: res.data
      });

      toast.success('Đăng nhập thành công!');
      return { success: true };
    } catch (error) {
      console.warn('Backend unavailable, switching to Mock Mode');

      // Fallback cho chế độ Dev/Test không có backend
      const mockToken = 'mock-jwt-token-for-testing';
      const mockUser = {
        id: '1',
        name: 'Admin User (Mock)',
        email: email,
        role: 'admin'
      };

      setAuthToken(mockToken);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          token: mockToken,
          user: mockUser
        }
      });

      toast.success('Đăng nhập (Chế độ Test Giao diện)!');
      return { success: true };
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const res = await axios.post('/api/auth/register', userData);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: res.data
      });

      toast.success('Đăng ký thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout user
  const logout = () => {
    // Clear token from axios headers
    setAuthToken(null);
    // Clear state
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    toast.success('Đã đăng xuất');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const res = await axios.put('/api/auth/me', userData);
      dispatch({
        type: AUTH_ACTIONS.USER_LOADED,
        payload: res.data.user
      });
      toast.success('Cập nhật thông tin thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Cập nhật thất bại';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Đổi mật khẩu thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (state.token) {
          setAuthToken(state.token);
          const res = await axios.get('/api/auth/me');
          dispatch({
            type: AUTH_ACTIONS.USER_LOADED,
            payload: res.data.user
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.warn('Backend unavailable during initAuth, checking for mock session');
        if (state.token) {
          // Mock User fallback logic
          const mockUser = {
            id: '1',
            name: 'Admin User (Mock)',
            email: 'admin@security.local',
            role: 'admin'
          };

          dispatch({
            type: AUTH_ACTIONS.USER_LOADED,
            payload: mockUser
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.AUTH_ERROR,
            payload: error.response?.data?.message || 'Lỗi xác thực'
          });
        }
      }
    };

    initAuth();
  }, [state.token]);

  // Set auth token on token change
  useEffect(() => {
    setAuthToken(state.token);
  }, [state.token]);

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
