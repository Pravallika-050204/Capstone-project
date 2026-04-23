import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  Clock, 
  ClipboardCheck, 
  Settings, 
  BarChart3, 
  LogOut,
  Building2,
  User
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
    { label: 'Book Room', path: '/book-room', icon: CalendarPlus, roles: ['employee', 'manager', 'admin'] },
    { label: 'My Bookings', path: '/my-bookings', icon: Clock, roles: ['employee', 'manager', 'admin'] },
    { label: 'Approvals', path: '/manager/requests', icon: ClipboardCheck, roles: ['manager', 'admin'] },
    { label: 'System Admin', path: '/admin/dashboard', icon: BarChart3, roles: ['admin'] },
    { label: 'Manage Rooms', path: '/admin/rooms', icon: Building2, roles: ['admin'] },
  ];

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '3rem', padding: '0 0.5rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          background: 'var(--primary)', 
          padding: '0.75rem', 
          borderRadius: '1rem',
          color: 'white',
          boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
        }}>
          <Building2 size={28} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em' }}>
            Engage
          </h2>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 1rem 0.5rem' }}>
          Main Menu
        </p>
        {navItems.filter(item => item.roles.includes(user?.role)).map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '1rem', 
          background: 'var(--background)', 
          borderRadius: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: 'var(--surface)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid var(--border)'
          }}>
            <User size={20} color="var(--primary)" />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: '500' }}>
              {user?.role}
            </p>
          </div>
        </div>
        
        <button onClick={handleLogout} className="btn-outline" style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

