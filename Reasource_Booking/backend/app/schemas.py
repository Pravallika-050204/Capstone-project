from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime
from .models import UserRole, BookingStatus

# Department Schemas
class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    model_config = {"from_attributes": True}

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str
    manager_id: Optional[int] = None

class UserShort(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    department_id: Optional[int] = None
    department_rel: Optional[DepartmentOut] = None

    model_config = {"from_attributes": True}

class UserOut(UserBase):
    id: int
    manager_id: Optional[int] = None
    manager: Optional[UserShort] = None
    department_rel: Optional[DepartmentOut] = None

    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str

# Room Schemas
class RoomBase(BaseModel):
    name: str
    capacity: int
    features: List[str]
    is_active: Optional[bool] = True
    needs_approval: Optional[bool] = True
    booking_hours: Dict[str, str]  # {"start": "09:00", "end": "18:00"}
    max_duration_hours: Optional[int] = 4
    allowed_roles: List[str] = ["employee", "manager", "admin"]
    allowed_departments: Optional[List[int]] = None # List of Department IDs
    buffer_time_minutes: Optional[int] = 0
    floor: Optional[str] = None
    building: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class MaintenanceBlockBase(BaseModel):
    room_id: int
    start_time: datetime
    end_time: datetime
    reason: str

class MaintenanceBlockCreate(MaintenanceBlockBase):
    pass

class MaintenanceBlockOut(MaintenanceBlockBase):
    id: int
    model_config = {"from_attributes": True}

class RoomOut(RoomBase):
    id: int
    status: Optional[str] = "available"
    maintenance_blocks: List[MaintenanceBlockOut] = []

    model_config = {"from_attributes": True}

# Booking Schemas
class BookingBase(BaseModel):
    room_id: int
    start_time: datetime
    end_time: datetime
    purpose: str

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BookingBase):
    pass

class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    manager_comment: Optional[str] = None

class BookingOut(BookingBase):
    id: int
    user_id: int
    routed_to_id: Optional[int] = None
    status: BookingStatus
    manager_comment: Optional[str] = None
    requested_at: datetime
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    user: UserOut
    room: RoomOut
    routed_to: Optional[UserShort] = None
    approved_by: Optional[UserShort] = None

    model_config = {"from_attributes": True}

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_rooms: int
    active_rooms: int
    pending_requests: int
    approved_today: int
    cancelled_today: int
    most_booked_room: Optional[str] = None
    utilization_rate: float
