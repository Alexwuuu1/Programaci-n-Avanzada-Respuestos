const http = require('http');

http.get('http://127.0.0.1:4040/api/requests/http?limit=100', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`Total requests in ngrok buffer: ${parsed.requests.length}`);
      const nonApi = parsed.requests.filter(r => !r.uri.startsWith('/api/') && !r.uri.startsWith('/rest/'));
      console.log(`Non-API requests count: ${nonApi.length}`);
      nonApi.slice(0, 10).forEach(r => {
        console.log(`- Time: ${r.start} | Method: ${r.request.method} | URI: ${r.uri} | Status: ${r.response?.status_code || 'PENDING'}`);
      });
    } catch (e) {
      console.error(e.message);
    }
  });
});
