import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  Building2 
} from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'employee',
    department_id: ''
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:8000/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/auth/register', {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id) : null
      });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
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
      <div className="card animate-in" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem', boxShadow: '0 15px 30px -10px rgba(0, 0, 0, 0.1)', borderRadius: '1.25rem', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '42px', 
            height: '42px', 
            background: 'var(--primary)', 
            borderRadius: '0.75rem',
            color: 'white',
            marginBottom: '0.75rem',
            boxShadow: '0 6px 12px rgba(99, 102, 241, 0.2)'
          }}>
            <Building2 size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Join Engage</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Create your employee account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="text" 
                placeholder="John Doe"
                value={formData.full_name} 
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                style={{ paddingLeft: '2.5rem', height: '40px', borderRadius: '0.6rem', border: '1.5px solid #e2e8f0', width: '100%', fontSize: '0.85rem' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Work Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="email" 
                placeholder="name@company.com"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{ paddingLeft: '2.5rem', height: '40px', borderRadius: '0.6rem', border: '1.5px solid #e2e8f0', width: '100%', fontSize: '0.85rem' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                style={{ paddingLeft: '2.5rem', height: '40px', borderRadius: '0.6rem', border: '1.5px solid #e2e8f0', width: '100%', fontSize: '0.85rem' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Department</label>
            <select 
              value={formData.department_id} 
              onChange={(e) => setFormData({...formData, department_id: e.target.value})}
              style={{ width: '100%', height: '40px', borderRadius: '0.6rem', border: '1.5px solid #e2e8f0', background: 'white', padding: '0 0.75rem', fontSize: '0.85rem' }}
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Role</label>
            <select 
              value={formData.role} 
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={{ width: '100%', height: '40px', borderRadius: '0.6rem', border: '1.5px solid #e2e8f0', background: 'white', padding: '0 0.75rem', fontSize: '0.85rem' }}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ height: '42px', fontSize: '0.9rem', marginTop: '0.5rem', borderRadius: '0.6rem', fontWeight: '700' }} disabled={loading}>
            {loading ? 'Creating Account...' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Register <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
