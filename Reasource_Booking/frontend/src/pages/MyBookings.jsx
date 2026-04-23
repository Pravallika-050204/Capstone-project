import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MoreVertical,
  XCircle,
  CheckCircle2,
  Timer,
  Search
} from 'lucide-react';
import RoomSelector from '../components/RoomSelector';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({
    room_id: '',
    date: '',
    start_time: '',
    end_time: '',
    purpose: ''
  });

  useEffect(() => {
    fetchBookings(selectedRoomFilter?.id);
    fetchRooms();
  }, [selectedRoomFilter]);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms');
    }
  };

  const fetchBookings = async (roomId = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/bookings/my', {
        params: { room_id: roomId || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.2rem' }}>
        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Are you sure you want to cancel this booking?</p>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const token = localStorage.getItem('token');
                await axios.post(`http://localhost:8000/bookings/${id}/status`, {
                  status: 'cancelled',
                  manager_comment: 'Cancelled by user'
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Booking cancelled');
                fetchBookings();
              } catch (error) {
                console.error('Cancellation failed:', error);
                toast.error(error.response?.data?.detail || 'Failed to cancel booking');
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
  };

  const handleEditClick = (booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    
    setEditingBooking(booking);
    setEditForm({
      room_id: booking.room_id,
      date: start.toISOString().split('T')[0],
      start_time: start.toTimeString().slice(0, 5),
      end_time: end.toTimeString().slice(0, 5),
      purpose: booking.purpose
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const start = `${editForm.date}T${editForm.start_time}:00`;
      const end = `${editForm.date}T${editForm.end_time}:00`;

      await axios.put(`http://localhost:8000/bookings/${editingBooking.id}`, {
        room_id: parseInt(editForm.room_id),
        start_time: start,
        end_time: end,
        purpose: editForm.purpose
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Booking updated successfully');
      setShowEditModal(false);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update booking');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="badge badge-pending">Pending</span>;
      case 'approved': return <span className="badge badge-approved">Approved</span>;
      case 'rejected': return <span className="badge badge-rejected">Rejected</span>;
      case 'cancelled': return <span className="badge badge-cancelled">Cancelled</span>;
      case 'completed': return <span className="badge badge-completed" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>Completed</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>My Bookings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track and manage your room reservations.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {(user?.role === 'admin' || user?.role === 'manager' 
            ? ['all', 'approved', 'cancelled', 'completed']
            : ['all', 'pending', 'approved', 'rejected', 'cancelled', 'completed']
          ).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn-primary' : 'btn-outline'}
              style={{ padding: '0.5rem 1.25rem', textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>
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
            style={{ padding: '0.5rem', border: 'none', color: 'var(--danger)', fontSize: '0.8rem' }}
          >
            Clear Room Filter
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading your bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Calendar size={32} color="var(--text-secondary)" />
          </div>
          <h3>No bookings found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>You haven't made any bookings in this category yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  background: 'rgba(37, 99, 235, 0.05)', 
                  borderRadius: '0.75rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid rgba(37, 99, 235, 0.1)'
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                    {new Date(booking.start_time).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)', lineHeight: 1 }}>
                    {new Date(booking.start_time).getDate()}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{booking.room.name}</h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} /> 
                      {new Date(booking.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
                      {new Date(booking.start_time).toLocaleDateString() !== new Date(booking.end_time).toLocaleDateString() ? 
                        ` - ${new Date(booking.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                      {' • '}
                      {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={14} /> floor {booking.room.floor || '1'}
                    </span>
                  </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: '600' }}>Purpose:</span> {booking.purpose}
                  </p>
                  {booking.status === 'pending' && booking.routed_to && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Timer size={14} />
                      <span>
                        Routed to <strong>{booking.routed_to.full_name}</strong> 
                        {booking.routed_to.role === 'admin' ? ' (Admin Fallback)' : ' (Manager)'}
                      </span>
                    </p>
                  )}
                  {booking.manager_comment && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', fontStyle: 'italic', color: booking.status === 'rejected' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: '600' }}>{booking.status === 'rejected' ? 'Rejection Reason' : 'Note'}:</span> {booking.manager_comment}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Requested on</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{new Date(booking.requested_at).toLocaleDateString()}</p>
                </div>
                {booking.status === 'completed' ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    color: 'var(--accent)', 
                    fontWeight: '700', 
                    fontSize: '0.875rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--primary-light)',
                    borderRadius: '0.75rem'
                  }}>
                    <CheckCircle2 size={16} /> Completed
                  </div>
                ) : (booking.status === 'pending' || booking.status === 'approved') && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleEditClick(booking)}
                      className="btn-outline" 
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleCancel(booking.id)}
                      className="btn-outline" 
                      style={{ color: 'var(--danger)', borderColor: '#fee2e2', padding: '0.5rem 1rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Edit Booking</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label">Select Room</label>
                  <RoomSelector 
                    onSelect={(room) => setEditForm({...editForm, room_id: room.id})}
                    selectedRoomId={editForm.room_id}
                  />
                </div>

                <div>
                  <label className="form-label">Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Start Time</label>
                    <input 
                      type="time"
                      className="form-input"
                      value={editForm.start_time}
                      onChange={(e) => setEditForm({...editForm, start_time: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">End Time</label>
                    <input 
                      type="time"
                      className="form-input"
                      value={editForm.end_time}
                      onChange={(e) => setEditForm({...editForm, end_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Purpose</label>
                  <textarea 
                    className="form-input"
                    value={editForm.purpose}
                    onChange={(e) => setEditForm({...editForm, purpose: e.target.value})}
                    required
                    rows="3"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
