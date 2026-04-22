import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const { t } = useLocalization();
  const [email, setEmail] = useState('admin@security.local');
  const [password, setPassword] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    clearError();

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      }
    } catch (submitError) {
      console.error('Login error:', submitError);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 100%)'
      }}
    >
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '1rem',
              borderRadius: '16px',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              marginBottom: '1rem',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
            }}
          >
            <ShieldCheckIcon style={{ width: 40, height: 40 }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Cyber Sentinel</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {t('login.subtitle')}
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('login.email')}
            </label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              placeholder={t('login.emailPlaceholder')}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('login.password')}
            </label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              placeholder="********"
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <div className="badge badge-critical" style={{ padding: '0.75rem', textAlign: 'center', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ padding: '0.875rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            {loading ? t('login.authenticating') : t('login.submit')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {t('login.secureChannel')}
        </p>
      </div>
    </div>
  );
};

export default Login;
