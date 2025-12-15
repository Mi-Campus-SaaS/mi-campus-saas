import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const KEY_RE = /^[a-z0-9][a-z0-9_.-]*$/i;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readStringLiteral(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

function isKeyCandidate(value) {
  return KEY_RE.test(value);
}

function getRepoRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..');
}

async function listFilesRecursive(dir, shouldIncludeFile, shouldSkipDir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name, fullPath)) continue;
      out.push(...(await listFilesRecursive(fullPath, shouldIncludeFile, shouldSkipDir)));
      continue;
    }
    if (entry.isFile() && shouldIncludeFile(entry.name, fullPath)) {
      out.push(fullPath);
    }
  }
  return out;
}

function collectKeysFromSourceFile(sourceFile) {
  const keys = new Set();

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const arg0 = node.arguments[0];
      const key = readStringLiteral(arg0);
      if (key && isKeyCandidate(key)) {
        const expr = node.expression;
        if (ts.isIdentifier(expr) && expr.text === 't') {
          keys.add(key);
        } else if (ts.isPropertyAccessExpression(expr) && expr.name.text === 't') {
          if (ts.isIdentifier(expr.expression) && expr.expression.text === 'i18n') {
            keys.add(key);
          }
        }
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const name =
        (ts.isIdentifier(node.name) && node.name.text) ||
        (ts.isStringLiteral(node.name) && node.name.text) ||
        undefined;
      if (name === 'message') {
        const key = readStringLiteral(node.initializer);
        if (key && isKeyCandidate(key)) keys.add(key);
      }
    }

    if (ts.isJsxAttribute(node) && node.name.text === 'i18nKey') {
      const init = node.initializer;
      if (init && ts.isStringLiteral(init) && isKeyCandidate(init.text)) keys.add(init.text);
      if (init && ts.isJsxExpression(init)) {
        const key = readStringLiteral(init.expression);
        if (key && isKeyCandidate(key)) keys.add(key);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return keys;
}

export async function scanFrontendUsedKeys() {
  const repoRoot = getRepoRoot();
  const srcDir = path.join(repoRoot, 'apps', 'frontend', 'src');

  const sourceFiles = await listFilesRecursive(
    srcDir,
    (name) => (name.endsWith('.ts') || name.endsWith('.tsx')) && !name.endsWith('.d.ts'),
    (name) => name === 'locales',
  );

  const usedKeys = new Set();
  for (const filePath of sourceFiles) {
    const code = await fs.readFile(filePath, 'utf8');
    const isTsx = filePath.endsWith('.tsx');
    const sourceFile = ts.createSourceFile(
      filePath,
      code,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    for (const key of collectKeysFromSourceFile(sourceFile)) usedKeys.add(key);
  }

  return { usedKeys };
}

export async function loadFrontendTranslations() {
  const repoRoot = getRepoRoot();
  const localesDir = path.join(repoRoot, 'apps', 'frontend', 'src', 'locales');

  const entries = await fs.readdir(localesDir, { withFileTypes: true });
  const locales = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  if (locales.length === 0) {
    throw new Error(`No locale directories found under ${localesDir}`);
  }

  const byLocale = {};
  for (const locale of locales) {
    const filePath = path.join(localesDir, locale, 'common.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      throw new Error(`Expected an object in ${filePath}`);
    }
    byLocale[locale] = { filePath, data: parsed };
  }

  return { byLocale };
}

export function getTranslationKeys(translationObject) {
  const keys = new Set();

  function walk(obj, prefix) {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        keys.add(fullKey);
      } else if (isRecord(v)) {
        walk(v, fullKey);
      }
    }
  }

  walk(translationObject, '');
  return keys;
}

export function applyFixesToTranslations(params) {
  const { original, missingKeys, pruneUnused, usedKeys } = params;

  const next = {};
  const missingSorted = [...missingKeys].sort();
  const used = usedKeys ? new Set(usedKeys) : undefined;

  for (const [k, v] of Object.entries(original)) {
    if (pruneUnused && used && !used.has(k)) continue;
    next[k] = v;
  }

  for (const key of missingSorted) {
    if (!(key in next)) next[key] = key;
  }

  return next;
}


