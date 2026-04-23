from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from . import models, schemas, auth, database

app = FastAPI(title="Engage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def update_expired_bookings(db: Session):
    """
    Automatically mark approved bookings as completed if their end time has passed.
    """
    now = datetime.utcnow()
    expired = db.query(models.Booking).filter(
        models.Booking.status == models.BookingStatus.APPROVED,
        models.Booking.end_time < now
    ).all()
    
    for booking in expired:
        booking.status = models.BookingStatus.COMPLETED
    
    if expired:
        db.commit()

def validate_booking_policy(db: Session, room: models.Room, booking: schemas.BookingBase, current_user: models.User, booking_id: Optional[int] = None):
    """
    Validate a booking request against the room's configured policies.
    """
    # 1. Role Check
    user_role = str(current_user.role).lower()
    allowed_roles = room.allowed_roles if room.allowed_roles else ["employee", "manager", "admin"]
    if user_role not in [r.lower() for r in allowed_roles]:
        raise HTTPException(status_code=403, detail=f"Your role ({user_role}) is not authorized to book this room.")

    # 1.5. Department Check
    if room.allowed_departments:
        if not current_user.department_id or current_user.department_id not in room.allowed_departments:
            dept_name = current_user.department_rel.name if current_user.department_rel else "None"
            raise HTTPException(
                status_code=403, 
                detail=f"Your department ({dept_name}) is not authorized to book this room. Access restricted."
            )

    # 2. Time Window Check
    if room.booking_hours:
        start_time_str = booking.start_time.strftime("%H:%M")
        end_time_str = booking.end_time.strftime("%H:%M")
        allowed_start = room.booking_hours.get("start", "00:00")
        allowed_end = room.booking_hours.get("end", "23:59")
        
        if start_time_str < allowed_start or end_time_str > allowed_end:
            raise HTTPException(status_code=400, detail=f"Booking is outside allowed hours for this room ({allowed_start} - {allowed_end})")

    # 3. Duration Check
    duration_minutes = (booking.end_time - booking.start_time).total_seconds() / 60
    max_duration_mins = (room.max_duration_hours or 4) * 60
    if duration_minutes > max_duration_mins:
        raise HTTPException(status_code=400, detail=f"Booking duration exceeds the maximum allowed for this room ({room.max_duration_hours} hours)")

    # 4. Buffer Time Check
    if room.buffer_time_minutes and room.buffer_time_minutes > 0:
        buffer = timedelta(minutes=room.buffer_time_minutes)
        
        # Check for bookings ending just before
        query_before = db.query(models.Booking).filter(
            models.Booking.room_id == room.id,
            models.Booking.status.in_([models.BookingStatus.PENDING, models.BookingStatus.APPROVED]),
            models.Booking.end_time > (booking.start_time - buffer),
            models.Booking.end_time <= booking.start_time
        )
        if booking_id:
            query_before = query_before.filter(models.Booking.id != booking_id)
        
        buffer_before = query_before.first()
        
        # Check for bookings starting just after
        query_after = db.query(models.Booking).filter(
            models.Booking.room_id == room.id,
            models.Booking.status.in_([models.BookingStatus.PENDING, models.BookingStatus.APPROVED]),
            models.Booking.start_time >= booking.end_time,
            models.Booking.start_time < (booking.end_time + buffer)
        )
        if booking_id:
            query_after = query_after.filter(models.Booking.id != booking_id)
            
        buffer_after = query_after.first()
        
        if buffer_before or buffer_after:
            raise HTTPException(status_code=400, detail=f"A buffer period of {room.buffer_time_minutes} minutes is required between bookings for this room.")

# Authentication Endpoints
@app.post("/auth/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    email = login_data.email.lower().strip()
    database.logger.info(f"Login attempt for user: {email} with role: {login_data.role}")
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        database.logger.warning(f"Login failed: User {email} not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    if not auth.verify_password(login_data.password, user.hashed_password):
        database.logger.warning(f"Login failed: Incorrect password for user {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Robust role comparison
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
    requested_role = login_data.role.value if hasattr(login_data.role, 'value') else str(login_data.role)
    
    if user_role.lower() != requested_role.lower():
        database.logger.warning(f"Login failed: Role mismatch for {email}. DB: {user_role}, Request: {requested_role}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials for the {requested_role} role",
        )
        
    database.logger.info(f"Login successful for user: {login_data.email}")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.post("/auth/register", response_model=schemas.UserOut)
def register(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    email = user_data.email.lower().strip()
    database.logger.info(f"Attempting to register user: {email}")
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        database.logger.warning(f"Registration failed: Email {email} already exists")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Logic: First user is always ADMIN. 
    # Subsequent users get the role they requested, or EMPLOYEE if none provided.
    user_count = db.query(models.User).count()
    if user_count == 0:
        role = models.UserRole.ADMIN
        database.logger.info("First user detected. Assigning ADMIN role.")
    else:
        role = user_data.role or models.UserRole.EMPLOYEE
        database.logger.info(f"Assigning role: {role}")
    
    hashed_password = auth.get_password_hash(user_data.password)
    new_user = models.User(
        email=email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=role,
        department_id=user_data.department_id
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
        database.logger.info(f"User {email} registered successfully with ID {new_user.id}")
    except Exception as e:
        db.rollback()
        database.logger.error(f"Database error during registration: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")
        
    return new_user

# Room Endpoints
@app.get("/rooms", response_model=List[schemas.RoomOut])
def get_rooms(
    capacity: Optional[int] = None,
    features: Optional[List[str]] = Query(None),
    room_id: Optional[int] = None,
    name: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    update_expired_bookings(db)
    
    # Admins can see all rooms, others only active ones
    query = db.query(models.Room)
    if str(current_user.role).lower() != "admin":
        query = query.filter(models.Room.is_active == True)
        
    if room_id:
        query = query.filter(models.Room.id == room_id)
    if name:
        query = query.filter(models.Room.name.ilike(f"%{name}%"))
    if capacity:
        query = query.filter(models.Room.capacity >= capacity)
    
    rooms = query.all()
    
    if features:
        rooms = [r for r in rooms if r.features and all(f in r.features for f in features)]
    
    # Calculate current availability status for each room
    now = datetime.utcnow()
    for room in rooms:
        # Check for active booking
        active_booking = db.query(models.Booking).filter(
            models.Booking.room_id == room.id,
            models.Booking.status == models.BookingStatus.APPROVED,
            models.Booking.start_time <= now,
            models.Booking.end_time > now
        ).first()
        
        # Check for active maintenance
        active_maint = db.query(models.MaintenanceBlock).filter(
            models.MaintenanceBlock.room_id == room.id,
            models.MaintenanceBlock.start_time <= now,
            models.MaintenanceBlock.end_time > now
        ).first()
        
        if active_maint:
            room.status = "maintenance"
        elif active_booking:
            room.status = "occupied"
        else:
            room.status = "available"
            
    return rooms

@app.get("/rooms/search", response_model=List[dict])
def search_rooms(
    start_time: datetime,
    end_time: datetime,
    capacity: Optional[int] = None,
    features: Optional[List[str]] = Query(None),
    room_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    update_expired_bookings(db)
    # Validation: Prevent searching for past slots
    now = datetime.now(start_time.tzinfo) if start_time.tzinfo else datetime.now()
    if start_time < now:
        raise HTTPException(status_code=400, detail="Please select a valid booking time. Past time slots are not allowed.")
    
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    # 1. Get rooms meeting criteria
    query = db.query(models.Room).filter(models.Room.is_active == True)
    if room_id:
        query = query.filter(models.Room.id == room_id)
    if capacity:
        query = query.filter(models.Room.capacity >= capacity)
    rooms = query.all()
    if features:
        rooms = [r for r in rooms if all(f in r.features for f in features)]

    results = []
    for room in rooms:
        # Check for overlapping bookings (Pending or Approved)
        overlap = db.query(models.Booking).filter(
            models.Booking.room_id == room.id,
            models.Booking.status.in_([models.BookingStatus.PENDING, models.BookingStatus.APPROVED]),
            models.Booking.start_time < end_time,
            models.Booking.end_time > start_time
        ).first()

        # Check for maintenance blocks
        maint = db.query(models.MaintenanceBlock).filter(
            models.MaintenanceBlock.room_id == room.id,
            models.MaintenanceBlock.start_time < end_time,
            models.MaintenanceBlock.end_time > start_time
        ).first()

        status = "available"
        reason = ""
        maintenance_info = None
        
        if overlap:
            status = "unavailable"
            reason = f"Already booked/pending ({overlap.status})"
        elif maint:
            status = "maintenance"
            reason = f"Under maintenance: {maint.reason}"
            maintenance_info = {
                "start_time": maint.start_time,
                "end_time": maint.end_time,
                "reason": maint.reason
            }

        results.append({
            "id": room.id,
            "name": room.name,
            "capacity": room.capacity,
            "features": room.features,
            "status": status,
            "reason": reason,
            "needs_approval": room.needs_approval,
            "maintenance_info": maintenance_info,
            "maintenance_blocks": [schemas.MaintenanceBlockOut.from_orm(b) for b in room.maintenance_blocks]
        })

    return results

# Booking Endpoints
@app.post("/bookings", response_model=schemas.BookingOut)
def create_booking(booking: schemas.BookingCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    update_expired_bookings(db)
    # Validations
    if booking.end_time <= booking.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    now = datetime.now(booking.start_time.tzinfo) if booking.start_time.tzinfo else datetime.now()
    if booking.start_time < now:
        raise HTTPException(status_code=400, detail="The selected time slot is in the past. Please choose a valid future time.")

    room = db.query(models.Room).get(booking.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    # Policy Validation
    validate_booking_policy(db, room, booking, current_user)

    # Conflict check
    conflict = db.query(models.Booking).filter(
        models.Booking.room_id == booking.room_id,
        models.Booking.status.in_([models.BookingStatus.PENDING, models.BookingStatus.APPROVED]),
        models.Booking.start_time < booking.end_time,
        models.Booking.end_time > booking.start_time
    ).first()

    if conflict:
        raise HTTPException(status_code=400, detail="Room is already reserved for this time slot")

    # Maintenance check
    maint_conflict = db.query(models.MaintenanceBlock).filter(
        models.MaintenanceBlock.room_id == booking.room_id,
        models.MaintenanceBlock.start_time < booking.end_time,
        models.MaintenanceBlock.end_time > booking.start_time
    ).first()
    
    if maint_conflict:
        raise HTTPException(status_code=400, detail=f"Room is under maintenance: {maint_conflict.reason} (Until {maint_conflict.end_time.strftime('%Y-%m-%d %H:%M')})")

    room = db.query(models.Room).get(booking.room_id)
    
    # Routing Logic
    routed_to_id = None
    
    # Auto-approve for Admins and Managers
    if str(current_user.role).lower() in ["admin", "manager"]:
        initial_status = models.BookingStatus.APPROVED
    else:
        # Everyone else (Employees) is PENDING
        initial_status = models.BookingStatus.PENDING
        # Send to manager if exists, else fallback to Admin
        if current_user.manager_id:
            routed_to_id = current_user.manager_id
        else:
            # Fallback: Send to first found Admin
            admin = db.query(models.User).filter(models.User.role.ilike("admin")).first()
            if admin:
                routed_to_id = admin.id

    new_booking = models.Booking(
        **booking.dict(),
        user_id=current_user.id,
        status=initial_status,
        routed_to_id=routed_to_id
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # Audit Log
    log = models.AuditLog(action="booking_created", details={"booking_id": new_booking.id, "routed_to": routed_to_id}, user_id=current_user.id)
    db.add(log)
    db.commit()

    return new_booking

@app.put("/bookings/{booking_id}", response_model=schemas.BookingOut)
def update_booking(
    booking_id: int, 
    booking_update: schemas.BookingUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. Get existing booking
    db_booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id # Only owner can edit
    ).first()
    
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found or access denied")

    if db_booking.status not in [models.BookingStatus.PENDING, models.BookingStatus.APPROVED]:
        raise HTTPException(status_code=400, detail="Cannot edit a booking that is already rejected or cancelled")

    # 2. Validations
    if booking_update.end_time <= booking_update.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    now = datetime.now(booking_update.start_time.tzinfo) if booking_update.start_time.tzinfo else datetime.now()
    if booking_update.start_time < now:
        raise HTTPException(status_code=400, detail="The selected time slot is in the past. Please choose a valid future time.")

    room = db.query(models.Room).get(booking_update.room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Selected room not found")
        
    # Policy Validation
    validate_booking_policy(db, room, booking_update, current_user, booking_id)

    # 3. Conflict check (EXCLUDING current booking ID)
    conflict = db.query(models.Booking).filter(
        models.Booking.id != booking_id,
        models.Booking.room_id == booking_update.room_id,
        models.Booking.status.in_([models.BookingStatus.PENDING, models.BookingStatus.APPROVED]),
        models.Booking.start_time < booking_update.end_time,
        models.Booking.end_time > booking_update.start_time
    ).first()

    if conflict:
        raise HTTPException(status_code=400, detail="This time slot is already booked for the selected room. Please choose a different time.")

    # 4. Handle Room/Policy changes
    if db_booking.room_id != booking_update.room_id:
        new_room = db.query(models.Room).get(booking_update.room_id)
        if not new_room:
            raise HTTPException(status_code=404, detail="Selected room not found")
        
        # Update routing if room changed
        if current_user.role not in [models.UserRole.MANAGER, models.UserRole.ADMIN]:
            if new_room.needs_approval:
                db_booking.status = models.BookingStatus.PENDING
                # Re-route if necessary
                if current_user.manager_id:
                    db_booking.routed_to_id = current_user.manager_id
                else:
                    admin = db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).first()
                    if admin:
                        db_booking.routed_to_id = admin.id
            else:
                db_booking.status = models.BookingStatus.APPROVED
                db_booking.routed_to_id = None

    # 5. Update fields
    db_booking.room_id = booking_update.room_id
    db_booking.start_time = booking_update.start_time
    db_booking.end_time = booking_update.end_time
    db_booking.purpose = booking_update.purpose

    db.commit()
    db.refresh(db_booking)

    # Audit Log
    log = models.AuditLog(action="booking_updated", details={"booking_id": booking_id}, user_id=current_user.id)
    db.add(log)
    db.commit()

    return db_booking

@app.get("/bookings/my", response_model=List[schemas.BookingOut])
def get_my_bookings(room_id: Optional[int] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    update_expired_bookings(db)
    query = db.query(models.Booking).filter(models.Booking.user_id == current_user.id)
    if room_id:
        query = query.filter(models.Booking.room_id == room_id)
    return query.order_by(models.Booking.requested_at.desc(), models.Booking.id.desc()).all()

# Manager Endpoints
@app.get("/manager/requests", response_model=List[schemas.BookingOut])
def get_manager_requests(room_id: Optional[int] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["manager", "admin"])), pending_only: bool = True):
    update_expired_bookings(db)
    query = db.query(models.Booking)
    if room_id:
        query = query.filter(models.Booking.room_id == room_id)
    if pending_only:
        query = query.filter(models.Booking.status == models.BookingStatus.PENDING)
    
    user_role = str(current_user.role).lower()
    
    if user_role == "admin":
        if pending_only:
            # Admins see pending requests routed to admins or unrouted
            admin_ids = db.query(models.User.id).filter(models.User.role.ilike("admin")).all()
            admin_id_list = [a[0] for a in admin_ids]
            query = query.filter(
                (models.Booking.routed_to_id.in_(admin_id_list)) | 
                (models.Booking.routed_to_id == None)
            )
        # If not pending_only, Admins see EVERYTHING in the system history
    else:
        # Managers see only requests routed to them
        query = query.filter(models.Booking.routed_to_id == current_user.id)
        
    return query.order_by(models.Booking.requested_at.desc(), models.Booking.id.desc()).all()

@app.post("/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: int, 
    update: schemas.BookingStatusUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    booking = db.get(models.Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Permission Check
    uid = int(current_user.id)
    owner_id = int(booking.user_id)
    routed_id = int(booking.routed_to_id) if booking.routed_to_id else None
    role = str(current_user.role).lower()
    # Explicitly use .value to get the string from the Enum
    new_status = update.status.value.lower() if hasattr(update.status, 'value') else str(update.status).lower()
    
    is_admin = "admin" in role
    is_owner = uid == owner_id
    is_manager = routed_id is not None and uid == routed_id
    
    # Permission logic:
    # 1. Admin can do anything
    # 2. Owner can cancel
    # 3. Manager can update status if routed to them
    
    can_proceed = False
    if is_admin:
        can_proceed = True
    elif is_owner and new_status == "cancelled":
        can_proceed = True
    elif is_manager:
        can_proceed = True
        
    if not can_proceed:
        detail = f"Access Denied. Your ID: {uid}, Role: {role}. Booking Owner: {owner_id}, Routed To: {routed_id}. Action: {new_status}"
        raise HTTPException(status_code=403, detail=detail)

    # Update status and approval info
    booking.status = new_status
    booking.manager_comment = update.manager_comment
    
    if new_status in ["approved", "rejected"]:
        booking.approved_by_id = current_user.id
        booking.approved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(booking)
    log = models.AuditLog(action=f"booking_{update.status}", details={"booking_id": booking_id, "comment": update.manager_comment}, user_id=current_user.id)
    db.add(log)
    db.commit()

    return {"message": f"Booking {update.status}"}


@app.get("/admin/bookings", response_model=List[schemas.BookingOut])
def get_all_bookings(room_id: Optional[int] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    update_expired_bookings(db)
    query = db.query(models.Booking)
    if room_id:
        query = query.filter(models.Booking.room_id == room_id)
    return query.order_by(models.Booking.requested_at.desc()).all()

# Admin Endpoints
@app.post("/rooms", response_model=schemas.RoomOut)
def create_room(room: schemas.RoomCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    db_room = models.Room(**room.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@app.put("/rooms/{room_id}", response_model=schemas.RoomOut)
def update_room(room_id: int, room_update: schemas.RoomCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    for key, value in room_update.dict().items():
        setattr(db_room, key, value)
    
    db.commit()
    db.refresh(db_room)
    return db_room

@app.get("/admin/stats", response_model=schemas.DashboardStats)
def get_admin_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    total_rooms = db.query(models.Room).count()
    active_rooms = db.query(models.Room).filter(models.Room.is_active == True).count()
    pending_requests = db.query(models.Booking).filter(models.Booking.status == models.BookingStatus.PENDING).count()
    
    # Real-time analytics
    from sqlalchemy import func
    
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    
    approved_today = db.query(models.Booking).filter(
        models.Booking.status == models.BookingStatus.APPROVED,
        models.Booking.start_time >= start_of_day
    ).count()

    cancelled_today = db.query(models.Booking).filter(
        models.Booking.status == models.BookingStatus.CANCELLED,
        models.Booking.requested_at >= start_of_day
    ).count()

    # Most booked room
    most_booked = db.query(
        models.Room.name, func.count(models.Booking.id).label('booking_count')
    ).join(models.Booking).group_by(models.Room.id).order_by(func.count(models.Booking.id).desc()).first()
    
    most_booked_name = most_booked[0] if most_booked else "N/A"

    # Simple utilization calculation: (Total booked hours today / Total available hours for active rooms)
    # This is a placeholder for a more complex calculation
    utilization = 0.45 # Default if no bookings
    if active_rooms > 0:
        total_booked_hours = db.query(func.sum(
            func.extract('epoch', models.Booking.end_time - models.Booking.start_time) / 3600
        )).filter(
            models.Booking.status == models.BookingStatus.APPROVED,
            models.Booking.start_time >= start_of_day
        ).scalar() or 0
        
        # Assume 9 hours available per room (9 AM to 6 PM)
        total_available_hours = active_rooms * 9
        utilization = min(1.0, total_booked_hours / total_available_hours) if total_available_hours > 0 else 0

    return {
        "total_rooms": total_rooms,
        "active_rooms": active_rooms,
        "pending_requests": pending_requests,
        "approved_today": approved_today,
        "cancelled_today": cancelled_today,
        "most_booked_room": most_booked_name,
        "utilization_rate": round(utilization, 2)
    }
# Admin User Management Endpoints
@app.get("/admin/users", response_model=List[schemas.UserOut])
def get_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    return db.query(models.User).order_by(models.User.id.desc()).all()

@app.get("/users/managers", response_model=List[schemas.UserOut])
def get_managers(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.User).filter(models.User.role == models.UserRole.MANAGER).all()

@app.post("/admin/users", response_model=schemas.UserOut)
def admin_create_user(user_data: schemas.UserCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    email = user_data.email.lower().strip()
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user_data.password)
    new_user = models.User(
        email=email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role,
        department_id=user_data.department_id,
        manager_id=user_data.manager_id if str(user_data.role).lower() == "employee" else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put("/admin/users/{user_id}", response_model=schemas.UserOut)
def admin_update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    db_user = db.query(models.User).get(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.email:
        db_user.email = user_update.email
    if user_update.full_name:
        db_user.full_name = user_update.full_name
    if user_update.password:
        db_user.hashed_password = auth.get_password_hash(user_update.password)
    if user_update.role:
        db_user.role = user_update.role
    if user_update.department_id is not None:
        db_user.department_id = user_update.department_id
    
    user_role_str = str(db_user.role).lower()
    if user_role_str == "employee":
        db_user.manager_id = user_update.manager_id
    else:
        db_user.manager_id = None
        
    db.commit()
    db.refresh(db_user)
    return db_user

# Maintenance Management Endpoints
@app.post("/admin/maintenance", response_model=schemas.MaintenanceBlockOut)
def create_maintenance_block(block: schemas.MaintenanceBlockCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    # Check for overlapping blocks
    existing = db.query(models.MaintenanceBlock).filter(
        models.MaintenanceBlock.room_id == block.room_id,
        models.MaintenanceBlock.start_time < block.end_time,
        models.MaintenanceBlock.end_time > block.start_time
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Room already has a maintenance block during this period")
        
    db_block = models.MaintenanceBlock(**block.dict())
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@app.delete("/admin/maintenance/{block_id}")
def delete_maintenance_block(block_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    block = db.query(models.MaintenanceBlock).get(block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Maintenance block not found")
    
    db.delete(block)
    db.commit()
    return {"message": "Maintenance block removed"}

# Department Endpoints
@app.get("/departments", response_model=List[schemas.DepartmentOut])
def get_departments(db: Session = Depends(database.get_db)):
    return db.query(models.Department).all()

@app.post("/admin/departments", response_model=schemas.DepartmentOut)
def create_department(dept: schemas.DepartmentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    db_dept = models.Department(name=dept.name)
    db.add(db_dept)
    try:
        db.commit()
        db.refresh(db_dept)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Department already exists")
    return db_dept

@app.delete("/admin/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.check_role(["admin"]))):
    dept = db.query(models.Department).get(dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if users are assigned to this department
    user_count = db.query(models.User).filter(models.User.department_id == dept_id).count()
    if user_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete department with assigned users")
        
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}
