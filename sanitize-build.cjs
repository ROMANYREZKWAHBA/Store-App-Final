const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'dist', 'assets');

if (!fs.existsSync(assetsDir)) {
  console.log('⚠️ Assets directory not found, skipping sanitization.');
  process.exit(0);
}

const files = fs.readdirSync(assetsDir);

files.forEach(file => {
  if (!file.endsWith('.js')) return;
  const filePath = path.join(assetsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let modified = false;
  
  // Replace dynamic global resolvers with safe native references
  const patterns = [
    { regex: /Function\(['"]return\s+this['"]\)/g, replacement: '(function(){return globalThis;})' },
    { regex: /Function\(['"]return\\x20this['"]\)/g, replacement: '(function(){return globalThis;})' }
  ];
  
  patterns.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
      console.log(`✅ Sanitized CSP-violating Function constructor in: ${file}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
