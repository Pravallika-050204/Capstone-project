from app.database import SessionLocal, engine, Base
from app import models, auth
from datetime import datetime, timedelta

def seed_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 0. Create Departments
    depts_to_create = [
        "DT (Digital Transformation)",
        "Data and AI",
        "AI First Lab",
        "Planning",
        "Salesforce",
        "Hr",
        "Marketing",
        "Finance",
        "Academy Head"
    ]
    dept_objs = {}
    for name in depts_to_create:
        d = models.Department(name=name)
        db.add(d)
        dept_objs[name] = d
    db.commit()

    # 1. Create Admin
    admin = models.User(
        email="admin@example.com",
        full_name="Enterprise Admin",
        hashed_password=auth.get_password_hash("admin123"),
        role=models.UserRole.ADMIN,
        department_id=dept_objs["DT (Digital Transformation)"].id
    )
    db.add(admin)
    db.commit()

    # 2. Create Manager
    manager = models.User(
        email="manager@example.com",
        full_name="Sarah Manager",
        hashed_password=auth.get_password_hash("manager123"),
        role=models.UserRole.MANAGER,
        department_id=dept_objs["Data and AI"].id
    )
    db.add(manager)
    db.commit()

    # 3. Create Employees
    # Employee with Manager
    emp_with_mgr = models.User(
        email="employee1@example.com",
        full_name="John Employee",
        hashed_password=auth.get_password_hash("employee123"),
        role=models.UserRole.EMPLOYEE,
        manager_id=manager.id,
        department_id=dept_objs["Data and AI"].id
    )
    # Employee WITHOUT Manager (Fallback to Admin)
    emp_no_mgr = models.User(
        email="employee2@example.com",
        full_name="Alice Independent",
        hashed_password=auth.get_password_hash("employee123"),
        role=models.UserRole.EMPLOYEE,
        manager_id=None,
        department_id=dept_objs["Hr"].id
    )
    db.add(emp_with_mgr)
    db.add(emp_no_mgr)
    db.commit()

    # 4. Create Rooms
    rooms_data = [
        {"name": "Boardroom A", "capacity": 20, "features": ["Projector", "Video conferencing", "WiFi"], "needs_approval": True, "allowed_departments": [dept_objs["DT (Digital Transformation)"].id, dept_objs["Data and AI"].id]},
        {"name": "Huddle Room 1", "capacity": 4, "features": ["Whiteboard", "WiFi"], "needs_approval": False, "allowed_departments": []},
        {"name": "Focus Pod", "capacity": 1, "features": ["WiFi", "AC"], "needs_approval": False, "allowed_departments": [dept_objs["Data and AI"].id]}
    ]

    rooms = []
    for room_info in rooms_data:
        room = models.Room(
            name=room_info["name"],
            capacity=room_info["capacity"],
            features=room_info["features"],
            booking_hours={"start": "09:00", "end": "18:00"},
            needs_approval=room_info["needs_approval"],
            allowed_departments=room_info["allowed_departments"],
            is_active=True
        )
        db.add(room)
        rooms.append(room)
    db.commit()

    # 5. Create Sample Bookings
    # Booking routed to Manager
    booking1 = models.Booking(
        user_id=emp_with_mgr.id,
        room_id=rooms[0].id, # Boardroom A (Needs Approval)
        start_time=datetime.utcnow() + timedelta(days=1, hours=10),
        end_time=datetime.utcnow() + timedelta(days=1, hours=11),
        purpose="Monthly Team Review",
        status=models.BookingStatus.PENDING,
        routed_to_id=manager.id
    )
    # Booking routed to Admin (Fallback)
    booking2 = models.Booking(
        user_id=emp_no_mgr.id,
        room_id=rooms[0].id, # Boardroom A (Needs Approval)
        start_time=datetime.utcnow() + timedelta(days=2, hours=14),
        end_time=datetime.utcnow() + timedelta(days=2, hours=15),
        purpose="Project Kickoff",
        status=models.BookingStatus.PENDING,
        routed_to_id=admin.id
    )
    db.add(booking1)
    db.add(booking2)
    db.commit()

    print("Database seeded successfully with enterprise scenarios!")
    db.close()

if __name__ == "__main__":
    seed_db()
