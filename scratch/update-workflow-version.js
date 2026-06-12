const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const crypto = require('crypto');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT versionCounter FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", (err, row) => {
  if (err) {
    console.error('Error reading workflow:', err);
    return;
  }
  if (!row) {
    console.error('Workflow not found');
    return;
  }

  const newVersionId = crypto.randomUUID();
  const newVersionCounter = (row.versionCounter || 0) + 1;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.run(
    "UPDATE workflow_entity SET versionId = ?, activeVersionId = ?, versionCounter = ?, updatedAt = ? WHERE id = '071LfThtq1qeiOIM'",
    [newVersionId, newVersionId, newVersionCounter, nowStr],
    function(updErr) {
      if (updErr) {
        console.error('Error updating version properties:', updErr);
      } else {
        console.log(`Workflow version properties successfully updated:`);
        console.log(`- New versionId / activeVersionId: ${newVersionId}`);
        console.log(`- New versionCounter: ${newVersionCounter}`);
        console.log(`- UpdatedAt: ${nowStr}`);
      }
    }
  );
  db.close();
});
