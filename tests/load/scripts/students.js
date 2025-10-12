import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { login, getAuthHeaders } from '../utils/auth.js';
import { BASE_URL, TEST_USERS, DEFAULT_OPTIONS } from '../utils/config.js';

export const options = {
  ...DEFAULT_OPTIONS,
  vus: 20,
  duration: '3m',
  thresholds: {
    ...DEFAULT_OPTIONS.thresholds,
    'students_list_success_rate': ['rate>0.99'],
    'students_detail_success_rate': ['rate>0.95'],
  },
};

const listSuccessRate = new Rate('students_list_success_rate');
const detailSuccessRate = new Rate('students_detail_success_rate');
const listDuration = new Trend('students_list_duration');
const detailDuration = new Trend('students_detail_duration');
const iterations = new Counter('students_iterations');

let authToken = null;

export function setup() {
  const user = TEST_USERS[0];
  const auth = login(user.username, user.password);
  
  if (!auth || !auth.accessToken) {
    throw new Error('Setup failed: Could not authenticate');
  }
  
  return { accessToken: auth.accessToken };
}

export default function (data) {
  const headers = getAuthHeaders(data.accessToken);
  
  const listStart = Date.now();
  const listResponse = http.get(
    `${BASE_URL}/students?page=1&limit=20`,
    {
      headers,
      tags: { name: 'StudentsList' },
    }
  );
  listDuration.add(Date.now() - listStart);

  const listSuccess = check(listResponse, {
    'students list status is 200': (r) => r.status === 200,
    'students list has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
    'students list response time < 300ms': (r) => r.timings.duration < 300,
  });
  listSuccessRate.add(listSuccess);

  if (listSuccess) {
    try {
      const body = JSON.parse(listResponse.body);
      if (body.data && body.data.length > 0) {
        const studentId = body.data[0].id;
        
        sleep(0.5);
        
        const detailStart = Date.now();
        const detailResponse = http.get(
          `${BASE_URL}/students/${studentId}`,
          {
            headers,
            tags: { name: 'StudentsDetail' },
          }
        );
        detailDuration.add(Date.now() - detailStart);

        const detailSuccess = check(detailResponse, {
          'student detail status is 200': (r) => r.status === 200,
          'student detail has id': (r) => {
            try {
              const detailBody = JSON.parse(r.body);
              return detailBody.id === studentId;
            } catch {
              return false;
            }
          },
          'student detail response time < 300ms': (r) => r.timings.duration < 300,
        });
        detailSuccessRate.add(detailSuccess);
      }
    } catch (e) {
      console.error(`Error processing student detail: ${e.message}`);
      detailSuccessRate.add(false);
    }
  }

  iterations.add(1);
  sleep(2);
}

export function handleSummary(data) {
  return {
    'tests/load/reports/students-summary.json': JSON.stringify(data, null, 2),
  };
}

