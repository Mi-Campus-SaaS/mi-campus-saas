import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, SMOKE_TEST_OPTIONS } from '../utils/config.js';

export const options = SMOKE_TEST_OPTIONS;

export default function () {
  const response = http.get(`${BASE_URL}/health`, {
    tags: { name: 'HealthCheck' },
  });

  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}

