import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Building2, Lock, Mail, ArrowRight, User, Briefcase } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, role);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top left, #eef2ff 0%, #f8fafc 100%)',
      padding: '1rem',
      overflow: 'hidden'
    }}>
      <div className="animate-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            background: 'var(--primary)',
            borderRadius: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            marginBottom: '0.75rem',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
            transform: 'rotate(-5deg)'
          }}>
            <Building2 size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Engage</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Enterprise Resource Management</p>
        </div>

        <div className="card" style={{ padding: '1.5rem', boxShadow: '0 15px 30px -10px rgba(0, 0, 0, 0.1)', borderRadius: '1rem', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  style={{ paddingLeft: '2.5rem', height: '40px', background: '#f8fafc', borderRadius: '0.6rem', fontSize: '0.85rem', border: '1.5px solid #e2e8f0' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Password</label>
                <a href="#" style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Forgot?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingLeft: '2.5rem', height: '40px', background: '#f8fafc', borderRadius: '0.6rem', fontSize: '0.85rem', border: '1.5px solid #e2e8f0' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.6rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Identify as</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[
                  { id: 'employee', label: 'Employee', icon: User },
                  { id: 'manager', label: 'Manager', icon: Briefcase },
                  { id: 'admin', label: 'Admin', icon: Building2 }
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{
                        padding: '0.4rem 0.25rem',
                        borderRadius: '0.6rem',
                        border: isSelected ? '2px solid var(--primary)' : '1.5px solid #e2e8f0',
                        background: isSelected ? 'var(--primary-light)' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Icon size={16} color={isSelected ? 'var(--primary)' : '#94a3b8'} />
                      <span style={{ fontSize: '0.65rem', fontWeight: '700', color: isSelected ? 'var(--primary)' : '#64748b' }}>{r.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', height: '40px', fontSize: '0.9rem', borderRadius: '0.6rem', fontWeight: '700' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : (
                <>
                  Enter Dashboard <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Need access? <a href="/register" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Request Account</a>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
          © 2024 Engage Systems Inc. • Secure Enterprise Environment
        </p>
      </div>
    </div>
  );
};

export default Login;

