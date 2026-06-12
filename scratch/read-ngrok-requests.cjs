const http = require('http');

http.get('http://127.0.0.1:4040/api/requests/http?limit=50', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('=== TELEGRAM WEBHOOK REQUESTS ===');
      let count = 0;
      parsed.requests.forEach(r => {
        if (!r.uri.startsWith('/api/') && !r.uri.startsWith('/rest/')) {
          console.log(`- Time: ${r.start} | Method: ${r.request.method} | URI: ${r.uri} | Status: ${r.response?.status_code || 'PENDING'}`);
          count++;
        }
      });
      if (count === 0) {
        console.log('No webhook requests from Telegram found in the last 50 ngrok requests.');
      }
    } catch (e) {
      console.error(e.message);
    }
  });
});
