import sqlite3
import os

db_path = "./resource_booking.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 2. Departments to ensure (New List)
target_departments = [
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

# 3. Normalize existing ones (Case-insensitive match for rename, then delete others)
cursor.execute("SELECT id, name FROM departments")
existing_rows = cursor.fetchall()
existing_names_map = {row[1].lower(): row[0] for row in existing_rows}

# 4. Process target list
final_ids = []
for dept_name in target_departments:
    low_name = dept_name.lower()
    if low_name in existing_names_map:
        # Update name to match target capitalization
        cursor.execute("UPDATE departments SET name = ? WHERE id = ?", (dept_name, existing_names_map[low_name]))
        final_ids.append(existing_names_map[low_name])
    else:
        # Insert new
        cursor.execute("INSERT INTO departments (name) VALUES (?)", (dept_name,))
        final_ids.append(cursor.lastrowid)

# 5. Delete departments NOT in the target list
# Note: This might leave users with invalid department_id if they were assigned to deleted ones.
# We'll set those users' department_id to NULL.
cursor.execute(f"UPDATE users SET department_id = NULL WHERE department_id NOT IN ({','.join(['?']*len(final_ids))})", final_ids)
cursor.execute(f"DELETE FROM departments WHERE id NOT IN ({','.join(['?']*len(final_ids))})", final_ids)

conn.commit()
conn.close()

print(f"Sync complete. Table now matches the requested list of {len(target_departments)} departments.")

conn.commit()
conn.close()

print(f"Update complete. Added {added} new departments.")
