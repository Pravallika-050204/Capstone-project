import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Users, Info, ChevronDown, XCircle, CheckCircle2, Clock } from 'lucide-react';

const RoomSelector = ({ onSelect, selectedRoomId, placeholder = "Search and select a room", showMaintenance = true }) => {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/rooms', {
          params: { name: searchTerm },
          headers: { Authorization: `Bearer ${token}` }
        });
        setRooms(response.data);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchRooms();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const formatMaintenanceDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getMaintenanceMsg = (room) => {
    const now = new Date();
    const activeBlock = room.maintenance_blocks?.find(block => {
      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      return now >= start && now <= end;
    });

    if (activeBlock) {
      return `Under maintenance from ${formatMaintenanceDate(activeBlock.start_time)} to ${formatMaintenanceDate(activeBlock.end_time)}`;
    }
    return null;
  };

  return (
    <div className="room-selector-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="room-selector-input"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0 1rem',
          height: '42px',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <Search size={16} color="var(--text-secondary)" />
        <span style={{ 
          flex: 1, 
          fontSize: '0.9rem', 
          color: selectedRoom ? 'var(--text-primary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {selectedRoom ? selectedRoom.name : placeholder}
        </span>
        <ChevronDown size={16} color="var(--text-secondary)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'white',
          marginTop: '0.5rem',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'white' }}>
            <input
              autoFocus
              type="text"
              placeholder="Type to search room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.85rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {rooms.length === 0 && !loading && (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              No rooms found
            </div>
          )}

          {rooms.map(room => {
            const maintenanceMsg = getMaintenanceMsg(room);
            const isDisabled = maintenanceMsg !== null;

            return (
              <div
                key={room.id}
                onClick={() => {
                  if (!isDisabled) {
                    onSelect(room);
                    setIsOpen(false);
                    setSearchTerm('');
                  }
                }}
                className={`dropdown-item ${isDisabled ? 'disabled' : ''}`}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.6 : 1,
                  background: isDisabled ? 'var(--background)' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: isDisabled ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {room.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Users size={12} /> {room.capacity}
                    </span>
                    {isDisabled ? (
                      <span className="badge badge-cancelled" style={{ fontSize: '0.6rem' }}>Maintenance</span>
                    ) : (
                      <span className="badge badge-approved" style={{ fontSize: '0.6rem' }}>Available</span>
                    )}
                  </div>
                </div>
                {isDisabled && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}>
                    <Info size={12} /> {maintenanceMsg}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomSelector;
