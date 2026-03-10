import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('admin@security.local');
  const [password, setPassword] = useState('admin123');

  const onSubmit = async (e) => {
    e.preventDefault();
    clearError();
    console.log('Submitting login with:', { email });
    try {
      const res = await login(email, password);
      console.log('Login response:', res);
      if (res.success) {
        console.log('Login successful, redirecting to dashboard');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2>Đăng nhập</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="form-group">
          <label>Mật khẩu</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
    </div>
  );
};

export default Login;
