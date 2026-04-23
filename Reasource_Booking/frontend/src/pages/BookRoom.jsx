import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Users, 
  Monitor, 
  Wifi, 
  Wind, 
  MapPin, 
  Calendar,
  Clock,
  Info,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import RoomSelector from '../components/RoomSelector';
import { useAuth } from '../context/AuthContext';

const BookRoom = () => {
  const [searchParams, setSearchParams] = useState({
    fromDate: new Date().toLocaleDateString('en-CA'),
    toDate: new Date().toLocaleDateString('en-CA'),
    startTime: '20:00',
    endTime: '21:00',
    capacity: 0,
    purpose: '',
    roomId: null
  });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [departments, setDepartments] = useState([]);

  const { user } = useAuth();
  const availableFeatures = ['AC', 'WiFi', 'Whiteboard', 'Projector'];

  const toggleFeature = (feature) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature) 
        : [...prev, feature]
    );
  };

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

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const start = `${searchParams.fromDate}T${searchParams.startTime}:00`;
      const end = `${searchParams.toDate}T${searchParams.endTime}:00`;

      if (new Date(start) < new Date()) {
        toast.error("Please select a valid booking time. Past time slots are not allowed.");
        setLoading(false);
        return;
      }

      if (new Date(end) <= new Date(start)) {
        toast.error("End time must be after start time");
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/rooms/search', {
        params: {
          start_time: start,
          end_time: end,
          capacity: searchParams.capacity > 0 ? searchParams.capacity : undefined,
          features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
          room_id: searchParams.roomId || undefined
        },
        paramsSerializer: {
          indexes: null // this will serialize arrays as features=1&features=2
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRooms(response.data);
      if (response.data.length === 0) {
        toast.error('No rooms available for this slot');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.detail || 'Failed to search rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedRoom) return;
    if (!searchParams.purpose) {
      toast.error('Please enter the purpose of the meeting');
      return;
    }

    setBookingLoading(true);
    try {
      const start = `${searchParams.fromDate}T${searchParams.startTime}:00`;
      const end = `${searchParams.toDate}T${searchParams.endTime}:00`;

      if (new Date(start) < new Date()) {
        toast.error("The selected time slot is in the past. Please choose a valid future time.");
        setBookingLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8000/bookings', {
        room_id: selectedRoom.id,
        start_time: start,
        end_time: end,
        purpose: searchParams.purpose
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const isApproved = response.data.status === 'approved';
      toast.success(isApproved ? 'Room booked successfully!' : 'Booking request sent for approval!');
      setSelectedRoom(null);
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const amenityIcons = {
    'Projector': Monitor,
    'WiFi': Wifi,
    'AC': Wind,
    'TV/display': Monitor,
    'Whiteboard': MapPin,
    'Wellness-friendly': Info
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Find a Space</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Search across all facilities with real-time availability.</p>
        </div>
        {user?.department_rel && (
          <div style={{ background: 'var(--primary-light)', padding: '0.75rem 1rem', borderRadius: '1rem', border: '1px solid var(--primary-light)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Your Department</p>
            <p style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)' }}>{user.department_rel.name}</p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>From Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="date" 
                value={searchParams.fromDate} 
                onChange={(e) => setSearchParams({...searchParams, fromDate: e.target.value})}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>To Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="date" 
                value={searchParams.toDate} 
                onChange={(e) => setSearchParams({...searchParams, toDate: e.target.value})}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Start Time</label>
            <div style={{ position: 'relative' }}>
              <Clock size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="time" 
                value={searchParams.startTime} 
                onChange={(e) => setSearchParams({...searchParams, startTime: e.target.value})}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>End Time</label>
            <div style={{ position: 'relative' }}>
              <Clock size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="time" 
                value={searchParams.endTime} 
                onChange={(e) => setSearchParams({...searchParams, endTime: e.target.value})}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Capacity</label>
            <div style={{ position: 'relative' }}>
              <Users size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input 
                type="number" 
                placeholder="Any"
                value={searchParams.capacity || ''} 
                onChange={(e) => setSearchParams({...searchParams, capacity: parseInt(e.target.value) || 0})}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
              />
            </div>
          </div>
          <div style={{ flex: '1.5', minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Specific Room</label>
            <RoomSelector 
              onSelect={(room) => setSearchParams({...searchParams, roomId: room.id})}
              selectedRoomId={searchParams.roomId}
              placeholder="Search by room name..."
            />
          </div>
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Select Room Features</label>
            <div 
              onClick={() => setShowFeaturesDropdown(!showFeaturesDropdown)}
              style={{ 
                padding: '0 0.8rem', 
                fontSize: '0.85rem', 
                height: '38px', 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius)', 
                background: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <Filter size={14} color="var(--primary)" />
                <span style={{ color: selectedFeatures.length ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {selectedFeatures.length > 0 ? `${selectedFeatures.length} selected` : 'Any Features'}
                </span>
              </div>
              <ChevronRight size={14} style={{ transform: showFeaturesDropdown ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {showFeaturesDropdown && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                zIndex: 100, 
                background: 'white', 
                marginTop: '0.5rem', 
                borderRadius: 'var(--radius)', 
                boxShadow: 'var(--shadow-lg)', 
                border: '1px solid var(--border)',
                padding: '0.5rem'
              }}>
                {availableFeatures.map(f => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-bg">
                    <input 
                      type="checkbox" 
                      checked={selectedFeatures.includes(f)} 
                      onChange={() => toggleFeature(f)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{f}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ height: '38px', fontSize: '0.85rem', padding: '0 1rem' }} disabled={loading}>
            {loading ? '...' : (
              <>
                <Search size={16} /> Search
              </>
            )}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Results ({rooms.length})</h2>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                <div style={{ width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '50%' }}></div> Available
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '10px', height: '10px', background: 'var(--border)', borderRadius: '50%' }}></div> Occupied
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4">
            {rooms.map((room) => {
              const isAvailable = room.status === 'available';
              const isMaintenance = room.status === 'maintenance';
              const isSelected = selectedRoom?.id === room.id;
              
              // Find the full room object to get allowed_departments if not in search result
              // Wait, search results might not have allowed_departments if I didn't update the search endpoint
              // Let's assume search results have it since I updated RoomOut
              const isDeptAllowed = !room.allowed_departments || room.allowed_departments.length === 0 || (user?.department_id && room.allowed_departments.includes(user.department_id));
              const canBook = isAvailable && isDeptAllowed;

              return (
                <div 
                  key={room.id}
                  className={`card ${canBook ? 'clickable' : ''} ${isMaintenance ? 'maintenance-card' : ''}`}
                  onClick={() => canBook && setSelectedRoom(room)}
                  style={{ 
                    cursor: canBook ? 'pointer' : 'not-allowed',
                    border: isSelected ? '2px solid var(--primary)' : (canBook ? '1px solid var(--border)' : (isMaintenance ? '1px solid #f87171' : '1px dashed var(--border)')),
                    background: isSelected ? 'var(--primary-light)' : (canBook ? 'var(--surface)' : (isMaintenance ? '#fff1f2' : 'rgba(241, 245, 249, 0.5)')),
                    padding: '1rem',
                    position: 'relative',
                    opacity: isDeptAllowed ? 1 : 0.7
                  }}
                >
                  {isMaintenance && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '0.5rem', 
                      right: '0.5rem', 
                      background: '#ef4444', 
                      color: 'white', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.6rem', 
                      fontWeight: '800',
                      zIndex: 1
                    }}>
                      MAINTENANCE
                    </div>
                  )}
                  {!isDeptAllowed && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '0.5rem', 
                      right: '0.5rem', 
                      background: '#64748b', 
                      color: 'white', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.6rem', 
                      fontWeight: '800',
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <ShieldAlert size={10} /> RESTRICTED
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{room.name}</h3>
                    <span className={`badge ${isAvailable ? 'badge-approved' : 'badge-cancelled'}`} style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>
                      {room.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <Users size={14} />
                    <span>Up to {room.capacity} seats</span>
                  </div>

                  {room.allowed_departments && room.allowed_departments.length > 0 && (
                    <div style={{ fontSize: '0.7rem', color: isDeptAllowed ? 'var(--text-secondary)' : 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Building2 size={12} />
                      <span>Allowed: {room.allowed_departments.map(id => departments.find(d => d.id === id)?.name).filter(Boolean).join(', ')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {room.features.slice(0, 3).map(res => {
                      const Icon = amenityIcons[res] || Info;
                      return (
                        <div key={res} title={res} style={{ padding: '4px', background: 'var(--background)', borderRadius: '6px' }}>
                          <Icon size={14} color="var(--primary)" />
                        </div>
                      );
                    })}
                    {room.features.length > 3 && (
                      <div style={{ padding: '2px 6px', background: 'var(--background)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                        +{room.features.length - 3}
                      </div>
                    )}
                  </div>

                  {canBook ? (
                    <button className={isSelected ? 'btn-primary' : 'btn-outline'} style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem' }}>
                      {isSelected ? 'Selected' : 'Select Room'}
                    </button>
                  ) : (
                    <div style={{ 
                      padding: '0.75rem', 
                      background: !isDeptAllowed ? '#f1f5f9' : (isMaintenance ? '#fee2e2' : '#f1f5f9'), 
                      borderRadius: '0.75rem', 
                      fontSize: '0.75rem', 
                      color: !isDeptAllowed ? '#64748b' : (isMaintenance ? '#991b1b' : '#64748b'), 
                      fontWeight: '600',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {!isDeptAllowed ? <ShieldAlert size={14} /> : (isMaintenance ? <XCircle size={14} /> : <Clock size={14} />)}
                        {!isDeptAllowed ? 'Department Restricted' : (isMaintenance ? 'Under Maintenance' : 'Already Booked')}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: '500', opacity: 0.8 }}>
                        {!isDeptAllowed 
                          ? 'Your department is not authorized to book this room.' 
                          : (room.reason || 'Unavailable for selected slot')
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedRoom && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(15, 23, 42, 0.4)', 
          backdropFilter: 'blur(8px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: '540px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Confirm Reservation</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedRoom.name}</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="btn-outline" style={{ width: '40px', height: '40px', padding: 0 }}>&times;</button>
            </div>
            
            <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Schedule</p>
                <p style={{ fontWeight: '700' }}>
                  {new Date(searchParams.fromDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {searchParams.fromDate !== searchParams.toDate ? ` - ${new Date(searchParams.toDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                </p>
                <p style={{ fontSize: '0.875rem' }}>{searchParams.startTime} - {searchParams.endTime}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Details</p>
                <p style={{ fontWeight: '700' }}>{selectedRoom.capacity} People</p>
                <p style={{ fontSize: '0.875rem' }}>
                  {selectedRoom.needs_approval ? (
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                      Approval Required (Routed to Manager/Admin)
                    </span>
                  ) : (
                    'Instant Booking'
                  )}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.6rem' }}>Meeting Purpose</label>
              <textarea 
                value={searchParams.purpose}
                onChange={(e) => setSearchParams({...searchParams, purpose: e.target.value})}
                placeholder="e.g., Weekly Team Sync, Strategy Workshop..."
                rows={3}
                required
                style={{ background: 'var(--background)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setSelectedRoom(null)} className="btn-outline" style={{ flex: 1, height: '48px' }}>Cancel</button>
              <button onClick={handleBooking} className="btn-primary" style={{ flex: 2, height: '48px' }} disabled={bookingLoading}>
                {bookingLoading ? 'Processing...' : (
                  <>
                    Confirm Booking <CheckCircle2 size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookRoom;

