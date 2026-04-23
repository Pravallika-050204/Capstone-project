import sqlite3
import os

db_path = "./resource_booking.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Creating 'departments' table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)
except sqlite3.OperationalError as e:
    print(f"Error creating departments table: {e}")

try:
    print("Adding 'department_id' column to 'users' table...")
    cursor.execute("ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id)")
except sqlite3.OperationalError:
    print("'department_id' already exists in users table.")

# Seed some initial departments if empty
cursor.execute("SELECT COUNT(*) FROM departments")
if cursor.fetchone()[0] == 0:
    print("Seeding initial departments...")
    departments = [("Engineering",), ("HR",), ("Sales",), ("Marketing",), ("Finance",), ("IT",)]
    cursor.executemany("INSERT INTO departments (name) VALUES (?)", departments)

conn.commit()
conn.close()
print("Department migration completed successfully.")
