import sqlite3
import json

conn = sqlite3.connect('scratch/n8n_database_temp.sqlite')
cursor = conn.cursor()
cursor.execute("SELECT id, name, active, nodes FROM workflow_entity WHERE name LIKE '%Telegram%'")
rows = cursor.fetchall()

print(f"Found {len(rows)} matching workflows:")
for r_id, name, active, nodes_str in rows:
    nodes = json.loads(nodes_str)
    print(f"\nWorkflow: {name} (ID: {r_id}) | Active: {active}")
    print("Nodes:")
    for n in nodes:
        name_node = n.get('name')
        type_node = n.get('type')
        print(f"  - {name_node} ({type_node})")
        if name_node == "Telegram Send":
            print(json.dumps(n, indent=4))
