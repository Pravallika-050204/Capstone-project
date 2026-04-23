from app.database import SessionLocal
from app import models

def restore_rooms():
    db = SessionLocal()
    rooms_data = [
        {"name": "Kadamba", "capacity": 12, "features": ["WiFi", "AC", "Power sockets"]},
        {"name": "Nalanda", "capacity": 30, "features": ["Projector", "WiFi", "AC", "Video conferencing"]},
        {"name": "Mourya", "capacity": 8, "features": ["TV/display", "WiFi", "Whiteboard"]},
        {"name": "Mantra", "capacity": 4, "features": ["WiFi", "AC"]},
        {"name": "Moksha", "capacity": 4, "features": ["WiFi", "Wellness-friendly"]},
        {"name": "Maitri", "capacity": 4, "features": ["WiFi", "AC"]},
        {"name": "Hoysala", "capacity": 4, "features": ["WiFi", "Whiteboard"]},
        {"name": "Sahyadri", "capacity": 4, "features": ["WiFi", "TV/display"]},
        {"name": "Vijayanagara", "capacity": 4, "features": ["WiFi", "AC"]},
        {"name": "Wadeyars", "capacity": 4, "features": ["WiFi", "Power sockets"]},
        {"name": "Kaveri", "capacity": 4, "features": ["WiFi", "HDMI cable"]},
        {"name": "Ganga", "capacity": 4, "features": ["WiFi", "Parking"]},
        {"name": "Indus", "capacity": 4, "features": ["WiFi", "AC"]}
    ]

    for room_info in rooms_data:
        room = db.query(models.Room).filter(models.Room.name == room_info["name"]).first()
        if not room:
            room = models.Room(name=room_info["name"])
            db.add(room)
        
        room.capacity = room_info["capacity"]
        room.features = room_info["features"]
        room.booking_hours = {"start": "09:00", "end": "18:00"}
        room.needs_approval = True
        room.is_active = True
    
    db.commit()
    print(f"Database sync complete! {len(rooms_data)} rooms processed.")
    db.close()

if __name__ == "__main__":
    restore_rooms()
