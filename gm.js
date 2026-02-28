const fs = require('fs');
const path = require('path');

const GmPlugin = async ({ project, client, $, directory, worktree }) => {
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
    onLoad: async () => {
      console.log('✓ gm plugin loaded');
    },

    getSystemPrompt: async () => {
      const rules = loadAgentRules();
      const prd = fs.existsSync(prdFile) ? fs.readFileSync(prdFile, 'utf-8').trim() : '';
      let prompt = rules || '';
      if (prd) prompt += '\n\nPENDING WORK (.prd):\n' + prd;
      return prompt;
    },

    onSessionEnd: async () => {
      const prd = fs.existsSync(prdFile) ? fs.readFileSync(prdFile, 'utf-8').trim() : '';
      if (prd) throw new Error('Work items remain in .prd - commit changes before exiting');
    }
  };
};

module.exports = { GmPlugin };
