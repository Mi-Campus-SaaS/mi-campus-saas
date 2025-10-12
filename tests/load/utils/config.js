import { SharedArray } from 'k6/data';

export const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000/api';

export const TEST_USERS = new SharedArray('users', function () {
  return [
    { 
      username: __ENV.TEST_USERNAME || 'admin', 
      password: __ENV.TEST_PASSWORD || 'Admin123!',
      role: 'admin'
    },
    { 
      username: __ENV.TEST_TEACHER || 'teacher1', 
      password: __ENV.TEST_TEACHER_PASSWORD || 'Teacher123!',
      role: 'teacher'
    },
  ];
});

export const DEFAULT_OPTIONS = {
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
  ext: {
    loadimpact: {
      projectID: 'mi-campus-saas',
      name: 'Performance Test',
    },
  },
};

export const SMOKE_TEST_OPTIONS = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export const BASELINE_OPTIONS = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.25'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_reqs: ['rate>20'],
  },
};

export const STRESS_TEST_OPTIONS = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  },
};

export const SPIKE_TEST_OPTIONS = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '10s', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '10s', target: 10 },
    { duration: '3m', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(99)<2000'],
  },
};

