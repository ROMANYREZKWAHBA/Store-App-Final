const key = Buffer.from('TEST-HWID-2026-StorePilot-Secret-2026').toString('base64');
console.log(key);
const fs = require('fs');
fs.writeFileSync('test_output.txt', key);
