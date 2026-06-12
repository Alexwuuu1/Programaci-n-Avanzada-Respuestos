const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const flatted = require('/usr/local/lib/node_modules/n8n/node_modules/flatted');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

function searchObj(obj, keyToFind, path = '') {
  if (!obj || typeof obj !== 'object') return;
  
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      searchObj(item, keyToFind, `${path}[${idx}]`);
    });
    return;
  }
  
  for (const [key, val] of Object.entries(obj)) {
    if (key === keyToFind) {
      console.log(`Found "${keyToFind}" at path: ${path}.${key}`);
      console.log('Value:', JSON.stringify(val, null, 2));
    }
    searchObj(val, keyToFind, `${path}.${key}`);
  }
}

db.get("SELECT data FROM execution_data WHERE executionId = 192", [], (err, row) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const decoded = flatted.parse(row.data);
  console.log('=== SEARCHING FOR inlineKeyboard IN EXECUTION DATA ===');
  searchObj(decoded, 'inlineKeyboard');
  
  console.log('=== SEARCHING FOR replyMarkup IN EXECUTION DATA ===');
  searchObj(decoded, 'replyMarkup');
  db.close();
});
