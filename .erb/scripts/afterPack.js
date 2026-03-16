const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName === 'linux') {
    const executableName = 'evoslauncher';
    const binPath = path.join(appOutDir, executableName);
    const newBinPath = path.join(appOutDir, `${executableName}-bin`);

    // Only rename if it hasn't been done already
    if (fs.existsSync(binPath) && !fs.existsSync(newBinPath)) {
      console.log('Wrapping Linux binary for --no-sandbox support...');
      fs.renameSync(binPath, newBinPath);

      const scriptContent = `#!/bin/bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
export ELECTRON_DISABLE_SANDBOX=1
"\$DIR/${executableName}-bin" --no-sandbox "\$@"
`;
      fs.writeFileSync(binPath, scriptContent);
      fs.chmodSync(binPath, '755');
      console.log('Successfully wrapped binary.');
    }
  }
};