import fs from 'node:fs/promises';
import { applyFixesToTranslations, getTranslationKeys, loadFrontendTranslations, scanFrontendUsedKeys } from './frontend.mjs';

function hasFlag(flag) {
  return process.argv.includes(flag);
}

const pruneUnused = hasFlag('--prune-unused');

const { usedKeys } = await scanFrontendUsedKeys();
const { byLocale } = await loadFrontendTranslations();

let changedFiles = 0;

for (const [locale, info] of Object.entries(byLocale)) {
  const definedKeys = getTranslationKeys(info.data);
  const missingKeys = [...usedKeys].filter((k) => !definedKeys.has(k));

  const next = applyFixesToTranslations({
    original: info.data,
    missingKeys,
    pruneUnused,
    usedKeys: pruneUnused ? usedKeys : undefined,
  });

  const nextJson = `${JSON.stringify(next, null, 2)}\n`;
  const currentJson = `${JSON.stringify(info.data, null, 2)}\n`;

  if (nextJson !== currentJson) {
    await fs.writeFile(info.filePath, nextJson, 'utf8');
    changedFiles += 1;
    console.log(`Updated ${info.filePath}`);
  }
}

if (changedFiles === 0) {
  console.log('No changes needed.');
} else {
  console.log(`Done. Updated ${changedFiles} file(s).`);
}


