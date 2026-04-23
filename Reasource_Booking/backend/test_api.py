import requests

BASE_URL = "http://localhost:8000"

def test_get_rooms():
    # Login
    login_payload = {
        "email": "admin@example.com",
        "password": "admin123",
        "role": "admin"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get Rooms
    response = requests.get(f"{BASE_URL}/rooms", headers=headers)
    if response.status_code == 200:
        rooms = response.json()
        print(f"Successfully fetched {len(rooms)} rooms.")
        for room in rooms:
            print(f"- {room['name']} (Active: {room['is_active']})")
    else:
        print(f"Failed to fetch rooms: {response.status_code} {response.text}")

if __name__ == "__main__":
    test_get_rooms()
