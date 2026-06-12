const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT executionId, data FROM execution_data ORDER BY executionId DESC LIMIT 1", [], (err, row) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  if (!row) {
    console.log('No execution data found');
  } else {
    console.log('=== LATEST EXECUTION DATA ===');
    console.log('Execution ID:', row.executionId);
    
    // In n8n, data is often stored as a string or compressed string
    // Let's print the first 1000 characters of the data to see its format
    console.log('Data (first 2000 chars):');
    console.log(row.data.slice(0, 2000));
  }
  db.close();
});
