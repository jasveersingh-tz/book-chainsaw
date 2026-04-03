const fs = require('fs');
const path = require('path');

console.log('📋 Copying source files to lib/...');

const srcDir = path.join(__dirname, '..', 'src');
const libDir = path.join(__dirname, '..', 'lib');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`   ✓ ${path.relative(srcDir, srcPath)}`);
    }
  }
}

copyRecursive(srcDir, libDir);
console.log('✅ Copy complete\n');
