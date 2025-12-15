import { spawnSync } from 'node:child_process';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const org = requireEnv('SENTRY_ORG');
const project = requireEnv('SENTRY_PROJECT_FRONTEND');
const release = requireEnv('SENTRY_RELEASE');

const sentryCli = process.platform === 'win32' ? 'sentry-cli.cmd' : 'sentry-cli';

function run(args) {
  const result = spawnSync(sentryCli, args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['releases', '--org', org, '--project', project, 'new', release]);
run([
  'releases',
  '--org',
  org,
  '--project',
  project,
  'files',
  release,
  'upload-sourcemaps',
  'apps/frontend/dist',
  '--ext',
  'map',
  '--rewrite',
  '--validate',
  '--strip-common-prefix',
  '--url-prefix',
  '~/',
]);
run(['releases', '--org', org, '--project', project, 'finalize', release]);


