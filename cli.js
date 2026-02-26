#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();
const ocConfigDir = path.join(homeDir, '.config', 'opencode');
const srcDir = __dirname;
const pluginMarker = path.join(ocConfigDir, 'plugins', 'gm-oc.mjs');
const isUpgrade = fs.existsSync(pluginMarker);

console.log(isUpgrade ? 'Upgrading gm-oc...' : 'Installing gm-oc...');

try {
  fs.mkdirSync(path.join(ocConfigDir, 'plugins'), { recursive: true });
  fs.mkdirSync(path.join(ocConfigDir, 'agents'), { recursive: true });

  function copyRecursive(src, dst) {
    if (!fs.existsSync(src)) return;
    if (fs.statSync(src).isDirectory()) {
      fs.mkdirSync(dst, { recursive: true });
      fs.readdirSync(src).forEach(f => copyRecursive(path.join(src, f), path.join(dst, f)));
    } else {
      fs.copyFileSync(src, dst);
    }
  }

  // Install ESM plugin for opencode auto-loading from plugins directory
  fs.copyFileSync(path.join(srcDir, 'gm-oc.mjs'), path.join(ocConfigDir, 'plugins', 'gm-oc.mjs'));

  // Copy agents into opencode config dir
  copyRecursive(path.join(srcDir, 'agents'), path.join(ocConfigDir, 'agents'));

  // Write/update opencode.json — set default_agent
  const ocJsonPath = path.join(ocConfigDir, 'opencode.json');
  let ocConfig = {};
  try { ocConfig = JSON.parse(fs.readFileSync(ocJsonPath, 'utf-8')); } catch (e) {}
  // Remove stale MCP config (no longer used)
  delete ocConfig.mcp;
  ocConfig.default_agent = 'gm';
  fs.writeFileSync(ocJsonPath, JSON.stringify(ocConfig, null, 2) + '\n');

  // Clean old AppData install location (no longer used by opencode)
  const oldDir = process.platform === 'win32'
    ? path.join(homeDir, 'AppData', 'Roaming', 'opencode', 'plugin') : null;
  if (oldDir && fs.existsSync(oldDir)) {
    try { fs.rmSync(oldDir, { recursive: true, force: true }); } catch (e) {}
  }

  // Install skills globally via the skills package (supports all agents)
  const { execSync: execSync2 } = require('child_process');
  try {
    execSync2('bunx skills add AnEntrypoint/plugforge --full-depth --all --global --yes', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Warning: skills install failed (non-fatal):', e.message);
  }

  console.log(`✓ gm-oc ${isUpgrade ? 'upgraded' : 'installed'} to ${ocConfigDir}`);
  console.log('Restart OpenCode to activate.');
} catch (e) {
  console.error('Installation failed:', e.message);
  process.exit(1);
}
