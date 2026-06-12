const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT nodes FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", (err, row) => {
  if (err) {
    console.error('Error reading workflow:', err);
    return;
  }
  if (!row) {
    console.error('Workflow not found');
    return;
  }

  try {
    const nodes = JSON.parse(row.nodes);

    // Encontrar el nodo Switch Keyboard Router
    const switchNode = nodes.find(n => n.name === 'Switch Keyboard Router');
    if (switchNode) {
      switchNode.parameters.rules = {
        rules: [
          {
            value2: "reply",
            operation: "equal",
            output: 0
          },
          {
            value2: "inline",
            operation: "equal",
            output: 1
          },
          {
            value2: "none",
            operation: "equal",
            output: 2
          }
        ]
      };
      console.log('Switch Keyboard Router node rules successfully updated.');
    } else {
      console.error('Switch Keyboard Router node not found');
      return;
    }

    db.run(
      "UPDATE workflow_entity SET nodes = ? WHERE id = '071LfThtq1qeiOIM'",
      [JSON.stringify(nodes)],
      function(updErr) {
        if (updErr) {
          console.error('Error updating SQLite database:', updErr);
        } else {
          console.log('Workflow database successfully updated with corrected Switch rules.');
        }
      }
    );

  } catch (e) {
    console.error('Error updating workflow rules:', e);
  }
});
