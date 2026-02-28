import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async ({ project, client, $, directory, worktree }) => {
  const pluginDir = __dirname;
  let agentRules = '';

  const loadAgentRules = () => {
    if (agentRules) return agentRules;
    const agentMd = path.join(pluginDir, 'agents', 'gm.md');
    try { agentRules = fs.readFileSync(agentMd, 'utf-8'); } catch (e) {}
    return agentRules;
  };

  const prdFile = path.join(directory, '.prd');

  return {
    'experimental.chat.system.transform': async (input, output) => {
      const rules = loadAgentRules();
      const prd = fs.existsSync(prdFile) ? fs.readFileSync(prdFile, 'utf-8').trim() : '';
      let content = rules || '';
      if (prd) content += '\n\nPENDING WORK (.prd):\n' + prd;
      if (content) output.system.push(content);
    }
  };
};
