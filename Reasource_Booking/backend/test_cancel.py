
import requests

BASE_URL = "http://localhost:8000"

def test_cancel():
    # Find an employee in DB
    from app.database import SessionLocal
    from app import models
    db = SessionLocal()
    employee = db.query(models.User).filter(models.User.role == "employee").first()
    if not employee:
        print("No employee found in DB")
        return
    
    # We assume password is password123 as per init_db
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": employee.email,
        "password": "password123",
        "role": "employee"
    })
    if login_res.status_code != 200:
        print(f"Login failed for {employee.email}: {login_res.text}")
        return
    
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get bookings
    bookings = requests.get(f"{BASE_URL}/bookings/my", headers=headers).json()
    pending = [b for b in bookings if b["status"] == "pending"]
    
    if not pending:
        # Create a booking first
        # Need a room ID
        rooms = requests.get(f"{BASE_URL}/rooms", headers=headers).json()
        room_id = rooms[0]["id"]
        
        booking_res = requests.post(f"{BASE_URL}/bookings", json={
            "room_id": room_id,
            "start_time": "2026-12-25T10:00:00",
            "end_time": "2026-12-25T11:00:00",
            "purpose": "Test cancellation"
        }, headers=headers)
        
        if booking_res.status_code != 200:
            print(f"Booking creation failed: {booking_res.text}")
            return
        
        b_id = booking_res.json()["id"]
        print(f"Created booking {b_id}")
    else:
        b_id = pending[0]["id"]
        print(f"Found pending booking {b_id}")
    
    # Try to cancel
    cancel_res = requests.post(f"{BASE_URL}/bookings/{b_id}/status", json={
        "status": "cancelled"
    }, headers=headers)
    
    print(f"Cancel Response ({cancel_res.status_code}): {cancel_res.text}")

if __name__ == "__main__":
    test_cancel()
