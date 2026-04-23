import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Check, 
  X, 
  MessageSquare, 
  User, 
  Calendar, 
  Clock,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Building2,
  MoreVertical,
  Search
} from 'lucide-react';
import RoomSelector from '../components/RoomSelector';

const ManagerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState(null);

  useEffect(() => {
    fetchRequests(selectedRoomFilter?.id);
  }, [pendingOnly, selectedRoomFilter]);

  const fetchRequests = async (roomId = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/manager/requests`, {
        params: { 
          pending_only: pendingOnly,
          room_id: roomId || undefined
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status) => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
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
      fetchRequests();
    } catch (error) {
      toast.error(`Failed to ${status} request`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }}>Approval Pipeline</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage team resource requests and resolve conflicts.</p>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setPendingOnly(true)}
            className={pendingOnly ? 'btn-primary' : 'btn-outline'}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            Pending Actions
          </button>
          <button 
            onClick={() => setPendingOnly(false)}
            className={!pendingOnly ? 'btn-primary' : 'btn-outline'}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            Approval History
          </button>
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
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="animate-pulse" style={{ color: 'var(--primary)' }}>Loading requests...</div>
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem', background: 'var(--surface)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--primary-light)', borderRadius: '2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1.5rem' }}>
            <ShieldCheck size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Zero Pending Actions</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>You've cleared all pending booking requests. Great job!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requestor</th>
                  <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resource</th>
                  <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule</th>
                  <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purpose</th>
                  <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '700' }}>
                          {req.user.full_name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{req.user.full_name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{req.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} color="var(--text-secondary)" />
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{req.room.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Calendar size={14} color="var(--primary)" />
                        <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                          {new Date(req.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          {new Date(req.start_time).toLocaleDateString() !== new Date(req.end_time).toLocaleDateString() ? 
                            ` - ${new Date(req.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} color="var(--text-secondary)" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(req.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(req.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.purpose}>
                        {req.purpose}
                      </p>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span className={`badge badge-${req.status}`}>{req.status}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      {req.status === 'pending' && (
                        <button 
                          onClick={() => setSelectedRequest(req)} 
                          className="btn-primary" 
                          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedRequest.user.full_name}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Resource</p>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedRequest.room.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Schedule</p>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    {new Date(selectedRequest.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {new Date(selectedRequest.start_time).toLocaleDateString() !== new Date(selectedRequest.end_time).toLocaleDateString() ? 
                      ` - ${new Date(selectedRequest.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                    {' • '}
                    {new Date(selectedRequest.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Meeting Purpose</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>{selectedRequest.purpose}</p>
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.6rem' }}>Decision Notes (Optional)</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment to the employee..."
                rows={3}
                style={{ background: 'var(--background)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => handleAction('rejected')} 
                className="btn-outline" 
                style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)', height: '48px' }}
                disabled={actionLoading}
              >
                Reject Request
              </button>
              <button 
                onClick={() => handleAction('approved')} 
                className="btn-primary" 
                style={{ flex: 1, background: 'var(--accent)', borderColor: 'var(--accent)', height: '48px' }}
                disabled={actionLoading}
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerRequests;

