import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const filesToProtect = ['main.js', 'preload.js', 'trial-utils.js'];

function run() {
  try {
    console.log('\n🚀 Starting Protected Production Build...');

    // 1. Build Vite Assets
    console.log('📦 Step 1: Building React assets with Vite...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2. Backup and Obfuscate Electron Files
    console.log('🛡️  Step 2: Obfuscating Electron process files...');
    filesToProtect.forEach(file => {
      const backup = file.replace('.js', '.dev.js');
      if (fs.existsSync(file)) {
        console.log(`  > Securing ${file}...`);
        fs.copyFileSync(file, backup); // Always keep a backup
        execSync(`npx javascript-obfuscator ${backup} --output ${file} --config obfuscator-config.json --target node`, { stdio: 'inherit' });
        // Delete backup if successful? No, keep it until the end of the script for restoration.
      }
    });

    // 3. Run Electron Builder
    console.log('🏗️  Step 3: Packaging application...');
    // We use npx to ensure it finds the local version
    execSync('npx electron-builder --win', { stdio: 'inherit' });

    console.log('\n✨ BUILD SUCCESSFUL! Protected EXE generated in /release');

  } catch (err) {
    console.error('\n❌ BUILD ERROR DETECTED:');
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    // 4. Restore original files
    console.log('\n🧹 Step 4: Cleaning up and restoring source files...');
    filesToProtect.forEach(file => {
      const backup = file.replace('.js', '.dev.js');
      if (fs.existsSync(backup)) {
        fs.copyFileSync(backup, file); // Restore original
        fs.unlinkSync(backup); // Delete backup
        console.log(`  > Restored ${file}`);
      }
    });
  }
}

run();
