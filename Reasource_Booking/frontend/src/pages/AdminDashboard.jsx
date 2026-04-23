import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2,
  CalendarCheck,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  User as UserIcon,
  Briefcase,
  Search
} from 'lucide-react';
import RoomSelector from '../components/RoomSelector';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState({
    total_rooms: 0,
    active_rooms: 0,
    pending_requests: 0,
    approved_today: 0,
    utilization_rate: 0
  });
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'employee',
    department_id: '',
    manager_id: ''
  });
  const [departments, setDepartments] = useState([]);

  const token = localStorage.getItem('token');

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/managers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(response.data);
    } catch (error) {
      console.error('Failed to fetch managers', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:8000/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments', error);
    }
  };

  const fetchBookings = async (roomId = null) => {
    try {
      const response = await axios.get('http://localhost:8000/admin/bookings', {
        params: { room_id: roomId || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings(selectedRoomFilter?.id);
    }
  }, [activeTab, selectedRoomFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers(), fetchManagers(), fetchDepartments(), fetchBookings(selectedRoomFilter?.id)]);
      setLoading(false);
    };
    init();
  }, []);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...userForm,
        department_id: userForm.department_id === '' ? null : parseInt(userForm.department_id),
        manager_id: userForm.manager_id === '' ? null : parseInt(userForm.manager_id)
      };
      
      if (editingUser) {
        await axios.put(`http://localhost:8000/admin/users/${editingUser.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User updated successfully');
      } else {
        await axios.post('http://localhost:8000/admin/users', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User created successfully');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ email: '', full_name: '', password: '', role: 'employee', manager_id: '' });
      fetchUsers();
      fetchManagers(); // Refresh manager list in case a new manager was added
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Action failed');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      full_name: user.full_name,
      password: '',
      role: user.role,
      department_id: user.department_id || '',
      manager_id: user.manager_id || ''
    });
    setShowUserModal(true);
  };

  const chartData = [
    { day: 'Mon', bookings: 12 },
    { day: 'Tue', bookings: 19 },
    { day: 'Wed', bookings: 15 },
    { day: 'Thu', bookings: 22 },
    { day: 'Fri', bookings: 30 },
    { day: 'Sat', bookings: 5 },
    { day: 'Sun', bookings: 2 },
  ];

  const maxBookings = Math.max(...chartData.map(d => d.bookings));

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>System management and analytics.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.75rem' }}>
          <button 
            onClick={() => setActiveTab('analytics')}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              border: 'none', 
              background: activeTab === 'analytics' ? 'white' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: activeTab === 'analytics' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              border: 'none', 
              background: activeTab === 'users' ? 'white' : 'transparent',
              color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: activeTab === 'users' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              border: 'none', 
              background: activeTab === 'bookings' ? 'white' : 'transparent',
              color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: activeTab === 'bookings' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Bookings
          </button>
        </div>
      </div>

      {activeTab === 'analytics' ? (
        <>
          <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                  <Building2 size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Resources</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.total_rooms}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Across 2 buildings</p>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--accent)' }}>
                  <CalendarCheck size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Bookings Today</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.approved_today}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>↑ 12% from yesterday</p>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--warning)' }}>
                  <Users size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Utilization</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>{(stats.utilization_rate * 100).toFixed(2)}%</h2>
              <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '0.75rem' }}>
                <div style={{ width: `${stats.utilization_rate * 100}%`, height: '100%', background: 'var(--warning)', borderRadius: '2px' }}></div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--danger)' }}>
                  <TrendingUp size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Peak Hours</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>11 AM - 3 PM</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Tue, Wed, Thu</p>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '2rem' }}>Weekly Booking Trends</h3>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 1rem' }}>
                {chartData.map(d => (
                  <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '10%' }}>
                    <div style={{ 
                      width: '100%', 
                      height: `${(d.bookings / maxBookings) * 150}px`, 
                      background: 'var(--primary)', 
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem' }}>Room Usage Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { name: 'Nalanda', use: 85, color: '#2563eb' },
                  { name: 'Kadamba', use: 72, color: '#10b981' },
                  { name: 'Mourya', use: 64, color: '#f59e0b' },
                  { name: 'Mantra', use: 45, color: '#64748b' }
                ].map(room => (
                  <div key={room.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span>{room.name}</span>
                      <span style={{ fontWeight: '600' }}>{room.use}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px' }}>
                      <div style={{ width: `${room.use}%`, height: '100%', background: room.color, borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>User Management</h3>
            <button 
              className="btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              onClick={() => {
                setEditingUser(null);
                setUserForm({ email: '', full_name: '', password: '', role: 'employee', manager_id: '' });
                setShowUserModal(true);
              }}
            >
              <UserPlus size={16} /> Add New User
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Department</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Manager</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{user.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.6rem', 
                        borderRadius: '1rem', 
                        fontSize: '0.7rem', 
                        fontWeight: '700',
                        textTransform: 'capitalize',
                        background: user.role === 'admin' ? '#fee2e2' : user.role === 'manager' ? '#e0f2fe' : '#f1f5f9',
                        color: user.role === 'admin' ? '#dc2626' : user.role === 'manager' ? '#0284c7' : '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {user.role === 'admin' ? <Shield size={10} /> : user.role === 'manager' ? <Briefcase size={10} /> : <UserIcon size={10} />}
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        {user.department_rel?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {user.manager ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: '500' }}>{user.manager.full_name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          {user.role === 'employee' ? 'Not assigned (Fallback to Admin)' : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                        Active
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => openEditModal(user)}
                        style={{ padding: '0.4rem', borderRadius: '0.4rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>All System Bookings</h2>
              <div style={{ width: '250px' }}>
                <RoomSelector 
                  onSelect={(room) => setSelectedRoomFilter(room)}
                  selectedRoomId={selectedRoomFilter?.id}
                  placeholder="Filter by room..."
                />
              </div>
              {selectedRoomFilter && (
                <button 
                  className="btn-outline" 
                  onClick={() => setSelectedRoomFilter(null)}
                  style={{ padding: '0.4rem', border: 'none', color: 'var(--danger)', fontSize: '0.75rem' }}
                >
                  Clear
                </button>
              )}
            </div>
            <button className="btn-outline" onClick={() => fetchBookings(selectedRoomFilter?.id)}>Refresh</button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Employee</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Room</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Schedule</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Approval</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600' }}>{booking.user.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{booking.user.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500' }}>{booking.room.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Floor {booking.room.floor}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.875rem' }}>{new Date(booking.start_time).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge badge-${booking.status.toLowerCase()}`}>{booking.status}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {booking.approved_by ? (
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{booking.approved_by.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(booking.approved_at).toLocaleString()}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          {booking.status === 'pending' ? 'Awaiting Approval' : 'No approval info'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-in" style={{ width: '400px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Full Name</label>
                <input 
                  type="text" 
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Email</label>
                <input 
                  type="email" 
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0' }}
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Password</label>
                  <input 
                    type="password" 
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0' }}
                    required={!editingUser}
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Role</label>
                <select 
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'white' }}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Department</label>
                <select 
                  value={userForm.department_id}
                  onChange={(e) => setUserForm({...userForm, department_id: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'white' }}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              {userForm.role === 'employee' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Manager Mapping</label>
                  <select 
                    value={userForm.manager_id}
                    onChange={(e) => setUserForm({...userForm, manager_id: e.target.value})}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'white' }}
                  >
                    <option value="">No Manager (Fallback to Admin)</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowUserModal(false)} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: '600', cursor: 'pointer' }}>{editingUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
