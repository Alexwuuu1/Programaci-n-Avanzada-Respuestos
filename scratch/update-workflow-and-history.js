const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const crypto = require('crypto');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT nodes, connections, versionCounter, name, description FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", (err, row) => {
  if (err) {
    console.error('Error reading workflow:', err);
    process.exit(1);
  }
  if (!row) {
    console.error('Workflow not found');
    process.exit(1);
  }

  const newVersionId = crypto.randomUUID();
  const newVersionCounter = (row.versionCounter || 0) + 1;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.serialize(() => {
    // 1. Update workflow_entity
    db.run(
      "UPDATE workflow_entity SET versionId = ?, activeVersionId = ?, versionCounter = ?, updatedAt = ? WHERE id = '071LfThtq1qeiOIM'",
      [newVersionId, newVersionId, newVersionCounter, nowStr],
      function(updErr) {
        if (updErr) {
          console.error('Error updating workflow_entity:', updErr);
          process.exit(1);
        }
        console.log('Successfully updated workflow_entity with new activeVersionId:', newVersionId);
      }
    );

    // 2. Insert into workflow_history
    db.run(
      `INSERT INTO workflow_history (versionId, workflowId, authors, createdAt, updatedAt, nodes, connections, name, autosaved, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newVersionId,
        '071LfThtq1qeiOIM',
        '[]', // authors is often a JSON array string of user IDs
        nowStr,
        nowStr,
        row.nodes,
        row.connections,
        row.name,
        0, // autosaved (false)
        row.description
      ],
      function(insErr) {
        if (insErr) {
          console.error('Error inserting into workflow_history:', insErr);
          process.exit(1);
        }
        console.log('Successfully inserted new version into workflow_history table.');
      }
    );
  });
});
