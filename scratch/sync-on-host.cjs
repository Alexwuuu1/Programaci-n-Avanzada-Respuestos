const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tempDir = path.resolve(__dirname, '../temp-workflows-export');
const targetDir = path.resolve(__dirname, '../n8n-workflows');

try {
  // 1. Clean and recreate temp folder on host
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);

  // 2. Copy files from container to host
  console.log('Copying workflows from sager-n8n to host...');
  execSync(`docker cp sager-n8n:/home/node/workflows-export/. "${tempDir}"`);

  // 3. Read mapping.json
  const mappingPath = path.join(tempDir, 'mapping.json');
  if (!fs.existsSync(mappingPath)) {
    console.error('mapping.json not found in temp directory');
    process.exit(1);
  }
  
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  console.log('Loaded mapping of', Object.keys(mapping).length, 'workflows.');

  // 4. Copy and rename to target directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
  }

  Object.entries(mapping).forEach(([id, name]) => {
    const srcFile = path.join(tempDir, `${id}.json`);
    if (fs.existsSync(srcFile)) {
      const destFile = path.join(targetDir, `${name}.json`);
      fs.copyFileSync(srcFile, destFile);
      console.log(`Synced: ${id}.json -> n8n-workflows/${name}.json`);
    } else {
      console.warn(`Warning: file ${id}.json not found in export`);
    }
  });

  // 5. Clean up temp folder
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('Workflow sync completed successfully!');

} catch (err) {
  console.error('Sync failed:', err.message);
}
