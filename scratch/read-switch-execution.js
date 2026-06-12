const fs = require('fs');
const path = '/usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-nodes-base@file+packages+nodes-base_@aws-sdk+credential-providers@3.808.0_asn1.js@5_8da18263ca0574b0db58d4fefd8173ce/node_modules/n8n-nodes-base/dist/nodes/Switch/V1/SwitchV1.node.js';

const code = fs.readFileSync(path, 'utf8');
const lines = code.split('\n');
console.log('=== SwitchV1 EXECUTION LOGIC ===');
for (let i = 580; i < 660 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
