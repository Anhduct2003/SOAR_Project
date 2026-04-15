import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLocalization } from './LocalizationContext';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  LOGOUT: 'LOGOUT',
  USER_LOADED: 'USER_LOADED',
  AUTH_ERROR: 'AUTH_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

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

export const AuthProvider = ({ children }) => {
  const { localizeApiMessage, t } = useLocalization();
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setAuthToken = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, []);

  const getLocalizedError = useCallback((error, fallbackKey) => {
    const rawMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message;
    return localizeApiMessage(rawMessage, fallbackKey);
  }, [localizeApiMessage]);

  const handleAuthFailure = useCallback((error, fallbackKey) => {
    const message = getLocalizedError(error, fallbackKey);
    setAuthToken(null);
    dispatch({
      type: AUTH_ACTIONS.AUTH_ERROR,
      payload: message
    });
    return message;
  }, [getLocalizedError, setAuthToken]);

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
      handleAuthFailure(error, 'common.errors.auth');
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const res = await axios.post('/api/auth/login', { email, password });

      if (res.data.token) {
        setAuthToken(res.data.token);
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: res.data
      });

      toast.success(t('auth.loginSuccess'));
      return { success: true };
    } catch (error) {
      const message = getLocalizedError(error, 'auth.loginFailed');
      setAuthToken(null);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const res = await axios.post('/api/auth/register', userData);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: res.data
      });

      toast.success(t('auth.registerSuccess'));
      return { success: true };
    } catch (error) {
      const message = getLocalizedError(error, 'auth.registerFailed');
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setAuthToken(null);
    dispatch({ type: AUTH_ACTIONS.LOGOUT, payload: null });
    toast.success(t('auth.logoutSuccess'));
  };

  const updateProfile = async (userData) => {
    try {
      const res = await axios.put('/api/auth/me', userData);
      dispatch({
        type: AUTH_ACTIONS.USER_LOADED,
        payload: res.data.user
      });
      toast.success(t('auth.profileUpdateSuccess'));
      return { success: true };
    } catch (error) {
      const message = getLocalizedError(error, 'auth.profileUpdateFailed');
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success(t('auth.passwordChangeSuccess'));
      return { success: true };
    } catch (error) {
      const message = getLocalizedError(error, 'auth.passwordChangeFailed');
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

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
        handleAuthFailure(error, 'common.errors.auth');
      }
    };

    initAuth();
  }, [handleAuthFailure, setAuthToken, state.token]);

  useEffect(() => {
    setAuthToken(state.token);
  }, [setAuthToken, state.token]);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
