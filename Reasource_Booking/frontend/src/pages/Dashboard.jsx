import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  User,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');

  const handleAction = async (status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/bookings/${selectedRequest.id}/status`, {
        status,
        manager_comment: comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Request ${status} successfully`);
      setSelectedRequest(null);
      setComment('');
      window.location.reload();
    } catch (error) {
      toast.error(`Action failed`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user.role === 'admin') {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:8000/admin/stats', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStats(res.data);
          
          // Fetch approval history for Admin's recent activity (not just pending)
          const reqRes = await axios.get('http://localhost:8000/manager/requests?pending_only=false', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRecentBookings(reqRes.data.slice(0, 5));
        } else {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:8000/bookings/my', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const bookings = res.data;
          setRecentBookings(bookings.slice(0, 5));
          
          // Calculate stats for employee
          const active = bookings.filter(b => b.status === 'approved' && new Date(b.start_time) > new Date()).length;
          const pending = bookings.filter(b => b.status === 'pending').length;
          const cancelled = bookings.filter(b => b.status === 'cancelled').length;
          const totalHours = bookings.reduce((acc, b) => {
            const start = new Date(b.start_time);
            const end = new Date(b.end_time);
            return acc + (end - start) / (1000 * 60 * 60);
          }, 0);

          setStats({
            active_bookings: active,
            pending_requests: pending,
            cancelled_bookings: cancelled,
            total_hours: Math.round(totalHours)
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.role]);

  const renderEmployeeDashboard = () => (
    <div className="grid grid-cols-4 animate-in">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '1rem', color: 'var(--primary)' }}>
            <CalendarCheck size={24} />
          </div>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{stats?.active_bookings || 0}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Active Bookings</p>
      </div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '1rem', color: 'var(--accent)' }}>
            <Clock size={24} />
          </div>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{stats?.total_hours || 0}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Total Hours (Month)</p>
      </div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '1rem', color: 'var(--warning)' }}>
            <AlertCircle size={24} />
          </div>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{stats?.pending_requests || 0}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Pending Approval</p>
      </div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '1rem', color: 'var(--danger)' }}>
            <XCircle size={24} />
          </div>
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>{stats?.cancelled_bookings || 0}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Cancelled</p>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="grid grid-cols-4 animate-in">
      <div className="card">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600' }}>Total Rooms</p>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '0.5rem' }}>{stats?.total_rooms || 0}</h2>
        <p style={{ color: 'var(--accent)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.75rem', fontWeight: '600' }}>
          <TrendingUp size={14} /> +2 this month
        </p>
      </div>
      <div className="card">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600' }}>Pending Requests</p>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '0.5rem' }}>{stats?.pending_requests || 0}</h2>
        <p style={{ color: 'var(--warning)', fontSize: '0.75rem', marginTop: '0.75rem', fontWeight: '600' }}>Needs attention</p>
      </div>
      <div className="card">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600' }}>Approved Today</p>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '0.5rem' }}>{stats?.approved_today || 0}</h2>
        <p style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '0.75rem', fontWeight: '600' }}>Across all floors</p>
      </div>
      <div className="card">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600' }}>Utilization</p>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '0.5rem' }}>{Math.round((stats?.utilization_rate || 0) * 100)}%</h2>
        <div style={{ height: '6px', background: '#eef2ff', borderRadius: '3px', marginTop: '1rem' }}>
          <div style={{ width: `${(stats?.utilization_rate || 0) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Welcome, {user?.full_name?.split(' ')[0]}!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Here's what's happening with your resources today.</p>
        </div>
        <Link to="/book-room">
          <button className="btn-primary" style={{ padding: '0.875rem 1.5rem' }}>
            Book a Room <ArrowRight size={18} />
          </button>
        </Link>
      </div>

      {user?.role === 'admin' ? renderAdminDashboard() : renderEmployeeDashboard()}

      <div style={{ marginTop: '3rem' }} className="grid grid-cols-3">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Recent Activity</h3>
            <Link 
              to={user.role === 'admin' ? '/manager/requests' : '/my-bookings'} 
              style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentBookings.length > 0 ? recentBookings.map((booking, i) => (
              <div key={booking.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.25rem', 
                padding: '1rem', 
                borderRadius: 'var(--radius)',
                borderBottom: i !== recentBookings.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.2s'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: 'var(--primary-light)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {user.role === 'admin' ? (
                    <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{booking.user?.full_name?.charAt(0)}</span>
                  ) : (
                    <Users size={24} color="var(--primary)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '1rem', fontWeight: '600' }}>
                    {user.role === 'admin' ? `${booking.user?.full_name} • ${booking.room?.name}` : booking.room?.name}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {new Date(booking.start_time).toLocaleDateString()} • {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                  
                  {user.role === 'admin' && booking.status === 'pending' && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedRequest(booking);
                      }}
                      className="btn-primary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    >
                      Review
                    </button>
                  )}

                  {user.role !== 'admin' && (booking.status === 'pending' || booking.status === 'approved') && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        toast((t) => (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.2rem' }}>
                            <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Cancel this booking?</p>
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                              <button 
                                onClick={async () => {
                                  toast.dismiss(t.id);
                                  try {
                                    const token = localStorage.getItem('token');
                                    await axios.post(`http://localhost:8000/bookings/${booking.id}/status`, { 
                                      status: 'cancelled',
                                      manager_comment: 'Cancelled by user'
                                    }, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    toast.success('Booking cancelled');
                                    setTimeout(() => window.location.reload(), 1000);
                                  } catch (err) { 
                                    console.error('Cancellation failed:', err);
                                    toast.error(err.response?.data?.detail || 'Failed to cancel'); 
                                  }
                                }}
                                style={{ background: 'var(--danger)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem' }}
                              >
                                Yes, Cancel
                              </button>
                              <button 
                                onClick={() => toast.dismiss(t.id)}
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem' }}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ), { duration: 5000, position: 'top-center', style: { borderRadius: '1rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' } });
                      }}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'transparent', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <p>No recent activity found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--primary-light)', border: '1px dashed var(--primary)', opacity: 0.8 }}>
          <p style={{ fontWeight: '700', color: 'var(--primary)', textAlign: 'center' }}>Need more options?</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>Visit the Book Room page for advanced filtering.</p>
        </div>
      </div>

      {selectedRequest && (
        <div style={{ 
          position: 'fixed', inset: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Review Request</h2>
              <button onClick={() => setSelectedRequest(null)} className="btn-outline" style={{ width: '36px', height: '36px', padding: 0 }}>&times;</button>
            </div>
            
            <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <User size={24} color="var(--primary)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Requestor</p>
                  <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedRequest.user?.full_name}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Resource</p>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedRequest.room?.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Schedule</p>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    {new Date(selectedRequest.start_time).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.6rem' }}>Decision Notes (Optional)</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment to the employee..."
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--background)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => handleAction('rejected')} 
                className="btn-outline" 
                style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)', height: '48px' }}
              >
                Reject
              </button>
              <button 
                onClick={() => handleAction('approved')} 
                className="btn-primary" 
                style={{ flex: 1, background: 'var(--accent)', borderColor: 'var(--accent)', height: '48px' }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
