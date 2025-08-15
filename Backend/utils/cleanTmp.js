// util/cleanTmp.js
import fs from 'fs/promises';
import path from 'path';
async function cleanTmp() {
  const files = await fs.readdir('tmp');
  for (const file of files) {
    await fs.unlink(path.join('tmp', file));
  }
}
cleanTmp().catch(console.error);