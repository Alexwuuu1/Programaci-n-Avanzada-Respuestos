const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');

db.get("SELECT nodes, connections FROM workflow_entity WHERE id='071LfThtq1qeiOIM'", (err, row) => {
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

    // Encontrar el nodo Telegram Send (Inline Keyboard)
    const telegramNode = nodes.find(n => n.name === 'Telegram Send (Inline Keyboard)');
    if (telegramNode) {
      telegramNode.parameters.inlineKeyboard = "={{ { rows: ($json.inline_keyboard) ? $json.inline_keyboard.map(r => ({ row: { buttons: r.map(b => ({ text: b.text, additionalFields: { callback_data: b.callback_data } })) } })) : [] } }}";
      console.log('Telegram Send (Inline Keyboard) node inlineKeyboard parameter successfully updated.');
    } else {
      console.error('Telegram Send (Inline Keyboard) node not found');
      return;
    }

    db.run(
      "UPDATE workflow_entity SET nodes = ? WHERE id = '071LfThtq1qeiOIM'",
      [JSON.stringify(nodes)],
      function(updErr) {
        if (updErr) {
          console.error('Error updating SQLite database:', updErr);
        } else {
          console.log('Workflow database successfully updated with corrected inline keyboard expression.');
        }
      }
    );

  } catch (e) {
    console.error('Error updating workflow expression:', e);
  }
});
