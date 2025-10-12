import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { login, refreshToken, logout } from '../utils/auth.js';
import { TEST_USERS, DEFAULT_OPTIONS } from '../utils/config.js';

export const options = {
  ...DEFAULT_OPTIONS,
  vus: 10,
  duration: '2m',
  thresholds: {
    ...DEFAULT_OPTIONS.thresholds,
    'login_success_rate': ['rate>0.99'],
    'refresh_success_rate': ['rate>0.99'],
    'logout_success_rate': ['rate>0.99'],
  },
};

const loginSuccessRate = new Rate('login_success_rate');
const refreshSuccessRate = new Rate('refresh_success_rate');
const logoutSuccessRate = new Rate('logout_success_rate');
const loginDuration = new Trend('login_duration');
const refreshDuration = new Trend('refresh_duration');
const iterations = new Counter('auth_iterations');

export default function () {
  const user = TEST_USERS[0];
  
  const loginStart = Date.now();
  const auth = login(user.username, user.password);
  loginDuration.add(Date.now() - loginStart);
  
  const loginSuccess = auth !== null && auth.accessToken !== undefined;
  loginSuccessRate.add(loginSuccess);

  if (!loginSuccess) {
    sleep(1);
    return;
  }

  sleep(2);

  const refreshStart = Date.now();
  const newAuth = refreshToken(auth.refreshToken);
  refreshDuration.add(Date.now() - refreshStart);
  
  const refreshSuccess = newAuth !== null && newAuth.accessToken !== undefined;
  refreshSuccessRate.add(refreshSuccess);

  sleep(1);

  const logoutSuccess = logout(
    newAuth ? newAuth.refreshToken : auth.refreshToken,
    newAuth ? newAuth.accessToken : auth.accessToken
  );
  logoutSuccessRate.add(logoutSuccess);

  iterations.add(1);
  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/load/reports/auth-summary.json': JSON.stringify(data, null, 2),
  };
}

