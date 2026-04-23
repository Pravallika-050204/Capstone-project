import sqlite3
import os

db_path = "./resource_booking.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Adding 'allowed_roles' column to 'rooms' table...")
    cursor.execute("ALTER TABLE rooms ADD COLUMN allowed_roles TEXT DEFAULT '[\"employee\", \"manager\", \"admin\"]'")
except sqlite3.OperationalError:
    print("'allowed_roles' already exists or rooms table missing.")

try:
    print("Adding 'allowed_departments' column to 'rooms' table...")
    cursor.execute("ALTER TABLE rooms ADD COLUMN allowed_departments TEXT")
except sqlite3.OperationalError:
    print("'allowed_departments' already exists.")

try:
    print("Adding 'buffer_time_minutes' column to 'rooms' table...")
    cursor.execute("ALTER TABLE rooms ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0")
except sqlite3.OperationalError:
    print("'buffer_time_minutes' already exists.")

conn.commit()
conn.close()
print("Migration completed successfully.")
