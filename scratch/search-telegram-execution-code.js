const fs = require('fs');
const path = '/usr/local/lib/node_modules/n8n/node_modules/.pnpm/n8n-nodes-base@file+packages+nodes-base_@aws-sdk+credential-providers@3.808.0_asn1.js@5_8da18263ca0574b0db58d4fefd8173ce/node_modules/n8n-nodes-base/dist/nodes/Telegram/Telegram.node.js';

const code = fs.readFileSync(path, 'utf8');
const lines = code.split('\n');

console.log('=== Telegram.node.js EXECUTOR CODE SEARCH ===');
lines.forEach((line, idx) => {
  if (line.includes('reply_markup') || line.includes('inline_keyboard') || line.includes('replyMarkup')) {
    // Print the line and 3 lines before/after
    console.log(`\n--- Line ${idx + 1} ---`);
    for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 3); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
});
