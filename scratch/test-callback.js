async function runTests() {
  const url = "http://localhost:3000/api/telegram/webhook";
  const chatId = "7051497734";

  console.log("--- TEST 1: Click 'edit_prod:13101-0C' ---");
  const res1 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, callbackQueryData: "edit_prod:13101-0C" })
  });
  console.log(await res1.json());

  console.log("\n--- TEST 2: Click 'edit_field:13101-0C:precio' ---");
  const res2 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, callbackQueryData: "edit_field:13101-0C:precio" })
  });
  console.log(await res2.json());

  console.log("\n--- TEST 3: Send text input '350.50' (New Price) ---");
  const res3 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, text: "350.50" })
  });
  console.log(await res3.json());

  console.log("\n--- TEST 4: Click 'confirm_save:13101-0C:precio:350.50' ---");
  const res4 = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, callbackQueryData: "confirm_save:13101-0C:precio:350.50" })
  });
  console.log(await res4.json());
}

runTests();
