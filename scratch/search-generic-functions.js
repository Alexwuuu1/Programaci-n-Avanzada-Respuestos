const fs = require('fs');
const path = '/usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-nodes-base@file+packages+nodes-base_@aws-sdk+credential-providers@3.808.0_asn1.js@5_8da18263ca0574b0db58d4fefd8173ce/node_modules/n8n-nodes-base/dist/nodes/Telegram/GenericFunctions.js';

if (!fs.existsSync(path)) {
  console.error('GenericFunctions.js not found');
  process.exit(1);
}

const code = fs.readFileSync(path, 'utf8');
const lines = code.split('\n');

console.log('=== GenericFunctions.js addAdditionalFields SEARCH ===');
let found = false;
lines.forEach((line, idx) => {
  if (line.includes('function addAdditionalFields') || line.includes('exports.addAdditionalFields')) {
    found = true;
    console.log(`Found function at line ${idx + 1}`);
    for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 100); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
if (!found) {
  console.log('Function not found by name, searching for replyMarkup...');
  lines.forEach((line, idx) => {
    if (line.includes('replyMarkup')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
}
