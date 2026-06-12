const fs = require('fs');
const path = require('path');
const n8nDir = '/home/node/.n8n';

try {
  const files = fs.readdirSync(n8nDir);
  console.log('Files in /home/node/.n8n:', files);
  
  if (files.includes('config')) {
    const configContent = fs.readFileSync(path.join(n8nDir, 'config'), 'utf8');
    console.log('Config content:', configContent);
  }
} catch (err) {
  console.error(err);
}
