const http = require('http');

http.get('http://127.0.0.1:4040/api/requests/http?limit=15', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('=== NGROK RECENT REQUESTS ===');
      parsed.requests.forEach(r => {
        console.log(`- Time: ${r.start} | Method: ${r.request.method} | URI: ${r.uri} | Status: ${r.response?.status_code || 'PENDING'}`);
      });
    } catch (e) {
      console.error(e.message);
    }
  });
});
