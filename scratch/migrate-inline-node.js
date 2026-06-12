const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const crypto = require('crypto');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

const WORKFLOW_ID = '071LfThtq1qeiOIM';

db.get("SELECT nodes, connections, versionCounter, name, description FROM workflow_entity WHERE id = ?", [WORKFLOW_ID], (err, row) => {
  if (err) {
    console.error('Error reading workflow:', err);
    process.exit(1);
  }
  if (!row) {
    console.error('Workflow not found');
    process.exit(1);
  }

  try {
    const nodes = JSON.parse(row.nodes);
    
    // Find the inline keyboard node
    const inlineNodeIndex = nodes.findIndex(n => n.name === 'Telegram Send (Inline Keyboard)');
    if (inlineNodeIndex === -1) {
      console.error('Telegram Send (Inline Keyboard) node not found in workflow');
      process.exit(1);
    }

    console.log('=== BEFORE MIGRATION ===');
    console.log(JSON.stringify(nodes[inlineNodeIndex], null, 2));

    // Update the node configuration
    nodes[inlineNodeIndex] = {
      parameters: {
        method: "POST",
        url: "https://api.telegram.org/bot8689666634:AAHN6DbtWD2whiytB0anjziOCUt1KuF2cro/sendMessage",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ {\n  chat_id: $json.chatId,\n  text: $json.output,\n  parse_mode: 'Markdown',\n  reply_markup: {\n    inline_keyboard: $json.inline_keyboard\n  }\n} }}",
        options: {}
      },
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.1,
      position: nodes[inlineNodeIndex].position,
      id: nodes[inlineNodeIndex].id,
      name: nodes[inlineNodeIndex].name
    };

    console.log('\n=== AFTER MIGRATION ===');
    console.log(JSON.stringify(nodes[inlineNodeIndex], null, 2));

    const newVersionId = crypto.randomUUID();
    const newVersionCounter = (row.versionCounter || 0) + 1;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updatedNodesStr = JSON.stringify(nodes);

    db.serialize(() => {
      // Begin transaction
      db.run("BEGIN TRANSACTION");

      // 1. Update workflow_entity with new nodes, activeVersionId, and versionCounter
      db.run(
        "UPDATE workflow_entity SET nodes = ?, versionId = ?, activeVersionId = ?, versionCounter = ?, updatedAt = ? WHERE id = ?",
        [updatedNodesStr, newVersionId, newVersionId, newVersionCounter, nowStr, WORKFLOW_ID],
        function(updErr) {
          if (updErr) {
            console.error('Error updating workflow_entity:', updErr);
            db.run("ROLLBACK");
            process.exit(1);
          }
          console.log('Successfully updated workflow_entity');
        }
      );

      // 2. Insert the updated workflow into workflow_history
      db.run(
        `INSERT INTO workflow_history (versionId, workflowId, authors, createdAt, updatedAt, nodes, connections, name, autosaved, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newVersionId,
          WORKFLOW_ID,
          '[]',
          nowStr,
          nowStr,
          updatedNodesStr,
          row.connections,
          row.name,
          0,
          row.description
        ],
        function(insErr) {
          if (insErr) {
            console.error('Error inserting into workflow_history:', insErr);
            db.run("ROLLBACK");
            process.exit(1);
          }
          console.log('Successfully inserted new version into workflow_history');
          
          // Commit transaction
          db.run("COMMIT", (commitErr) => {
            if (commitErr) {
              console.error('Error committing transaction:', commitErr);
              process.exit(1);
            }
            console.log('Transaction committed successfully!');
            db.close();
          });
        }
      );
    });

  } catch (e) {
    console.error('Error processing workflow JSON:', e);
    process.exit(1);
  }
});
