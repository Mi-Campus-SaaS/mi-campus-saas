import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { login, getAuthHeaders } from '../utils/auth.js';
import { BASE_URL, TEST_USERS, DEFAULT_OPTIONS } from '../utils/config.js';

export const options = {
  ...DEFAULT_OPTIONS,
  vus: 15,
  duration: '3m',
  thresholds: {
    ...DEFAULT_OPTIONS.thresholds,
    'grades_student_success_rate': ['rate>0.95'],
  },
};

const gradesSuccessRate = new Rate('grades_student_success_rate');
const gradesDuration = new Trend('grades_student_duration');
const iterations = new Counter('grades_iterations');

export function setup() {
  const user = TEST_USERS[0];
  const auth = login(user.username, user.password);
  
  if (!auth || !auth.accessToken) {
    throw new Error('Setup failed: Could not authenticate');
  }
  
  const headers = getAuthHeaders(auth.accessToken);
  const studentsResponse = http.get(`${BASE_URL}/students?page=1&limit=10`, { headers });
  
  let studentIds = [];
  if (studentsResponse.status === 200) {
    try {
      const body = JSON.parse(studentsResponse.body);
      if (body.data && body.data.length > 0) {
        studentIds = body.data.map(s => s.id);
      }
    } catch (e) {
      console.error(`Failed to parse students: ${e.message}`);
    }
  }
  
  return { 
    accessToken: auth.accessToken,
    studentIds: studentIds
  };
}

export default function (data) {
  if (!data.studentIds || data.studentIds.length === 0) {
    console.warn('No student IDs available for testing');
    sleep(1);
    return;
  }

  const headers = getAuthHeaders(data.accessToken);
  const studentId = data.studentIds[Math.floor(Math.random() * data.studentIds.length)];
  
  const start = Date.now();
  const response = http.get(
    `${BASE_URL}/grades/student/${studentId}`,
    {
      headers,
      tags: { name: 'GradesStudent' },
    }
  );
  gradesDuration.add(Date.now() - start);

  const success = check(response, {
    'grades status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'grades response time < 400ms': (r) => r.timings.duration < 400,
    'grades has valid structure': (r) => {
      if (r.status === 404) return true;
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });
  gradesSuccessRate.add(success);

  iterations.add(1);
  sleep(1.5);
}

export function handleSummary(data) {
  return {
    'tests/load/reports/grades-summary.json': JSON.stringify(data, null, 2),
  };
}

