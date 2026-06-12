const fs = require('fs');
const path = '/usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-nodes-base@file+packages+nodes-base_@aws-sdk+credential-providers@3.808.0_asn1.js@5_8da18263ca0574b0db58d4fefd8173ce/node_modules/n8n-nodes-base/dist/nodes/Switch/V1/SwitchV1.node.js';

if (!fs.existsSync(path)) {
  console.error('File does not exist');
  process.exit(1);
}

const code = fs.readFileSync(path, 'utf8');

// Find function that executes the node (usually named 'execute')
console.log('=== SEARCHING FOR EXECUTE METHOD OR RULES IN SWITCH NODE ===');
const match = code.match(/execute\s*\([\s\S]*?\}\s*const/);
if (match) {
  console.log('Found execute start:', match[0]);
}

// Let's print lines containing "rules" or "operation"
const lines = code.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('rules') || line.includes('operation') || line.includes('value2') || line.includes('dataType')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
