import { getTranslationKeys, loadFrontendTranslations, scanFrontendUsedKeys } from './frontend.mjs';

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function printList(title, items) {
  if (items.length === 0) return;
  console.log(`\n${title}`);
  for (const item of items) console.log(`- ${item}`);
}

const failUnused = hasFlag('--fail-unused');

const { usedKeys } = await scanFrontendUsedKeys();
const { byLocale } = await loadFrontendTranslations();

const missingByLocale = new Map();
const unusedByLocale = new Map();

for (const [locale, info] of Object.entries(byLocale)) {
  const definedKeys = getTranslationKeys(info.data);

  const missing = [...usedKeys].filter((k) => !definedKeys.has(k)).sort();
  const unused = [...definedKeys].filter((k) => !usedKeys.has(k)).sort();

  missingByLocale.set(locale, missing);
  unusedByLocale.set(locale, unused);
}

let hasMissing = false;
for (const [locale, missing] of missingByLocale.entries()) {
  if (missing.length > 0) {
    hasMissing = true;
    printList(`Missing keys (${locale})`, missing);
  }
}

let hasUnused = false;
for (const [locale, unused] of unusedByLocale.entries()) {
  if (unused.length > 0) {
    hasUnused = true;
    printList(`Unused keys (${locale})`, unused);
  }
}

if (hasMissing) {
  console.log(`\nFound missing i18n keys. Run: yarn i18n:fix`);
  process.exit(1);
}

if (failUnused && hasUnused) {
  console.log(`\nFound unused i18n keys. Run: yarn i18n:fix --prune-unused`);
  process.exit(1);
}

console.log(
  `\nOK: i18n keys are complete. Used keys: ${usedKeys.size}.` +
    (hasUnused ? ' (Unused keys reported above.)' : ''),
);


