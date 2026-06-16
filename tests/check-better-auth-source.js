/* eslint-disable @typescript-eslint/no-require-imports */const path = require('path');
const betterAuthPath = require.resolve('better-auth');
console.log('Better Auth location:', betterAuthPath);

// Read the username plugin source
const fs = require('fs');
const usernamePluginPath = path.join(path.dirname(betterAuthPath), 'plugins', 'username.js');
if (fs.existsSync(usernamePluginPath)) {
  const content = fs.readFileSync(usernamePluginPath, 'utf-8');
  // Look for account query or signIn
  const lines = content.split('\n');
  let inSignIn = false;
  let relevantLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('signInUsername') || lines[i].includes('accountId') || lines[i].includes('findOne')) {
      relevantLines.push(`${i+1}: ${lines[i]}`);
    }
  }
  console.log('\nRelevant lines in username.js:');
  relevantLines.forEach(l => console.log(l));
}
