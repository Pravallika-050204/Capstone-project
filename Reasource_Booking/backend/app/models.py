from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from .database import Base

class UserRole(str, enum.Enum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    ADMIN = "admin"

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    users = relationship("User", back_populates="department_rel")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.EMPLOYEE)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    department_rel = relationship("Department", back_populates="users")

    bookings = relationship("Booking", back_populates="user", foreign_keys="[Booking.user_id]")
    
    # Self-referencing relationship for manager-employee hierarchy
    manager = relationship("User", remote_side=[id], back_populates="managed_employees", uselist=False)
    managed_employees = relationship("User", back_populates="manager", uselist=True)
    
    routed_bookings = relationship("Booking", back_populates="routed_to", foreign_keys="[Booking.routed_to_id]")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    capacity = Column(Integer)
    features = Column(JSON)  # List of amenities: ["Projector", "WiFi", etc.]
    is_active = Column(Boolean, default=True)
    needs_approval = Column(Boolean, default=True)
    booking_hours = Column(JSON)  # {"start": "09:00", "end": "18:00"}
    max_duration_hours = Column(Integer, default=4)
    allowed_roles = Column(JSON, default=["employee", "manager", "admin"])
    allowed_departments = Column(JSON, nullable=True)
    buffer_time_minutes = Column(Integer, default=0)
    floor = Column(String, nullable=True)
    building = Column(String, nullable=True)

    bookings = relationship("Booking", back_populates="room")
    maintenance_blocks = relationship("MaintenanceBlock", back_populates="room")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    room_id = Column(Integer, ForeignKey("rooms.id"))
    routed_to_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Who this is currently routed to
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    purpose = Column(String)
    status = Column(String, default=BookingStatus.PENDING)
    manager_comment = Column(String, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="bookings", foreign_keys=[user_id])
    routed_to = relationship("User", back_populates="routed_bookings", foreign_keys=[routed_to_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    room = relationship("Room", back_populates="bookings")
    status_history = relationship("BookingStatusHistory", back_populates="booking")

class BookingStatusHistory(Base):
    __tablename__ = "booking_status_history"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    status = Column(String)
    changed_at = Column(DateTime, default=datetime.utcnow)
    changed_by_id = Column(Integer, ForeignKey("users.id"))
    comment = Column(String, nullable=True)

    booking = relationship("Booking", back_populates="status_history")

class MaintenanceBlock(Base):
    __tablename__ = "maintenance_blocks"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    reason = Column(String)

    room = relationship("Room", back_populates="maintenance_blocks")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)  # e.g., "booking_created", "room_updated"
    details = Column(JSON)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
