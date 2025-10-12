import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { login, getAuthHeaders, refreshToken } from '../utils/auth.js';
import { BASE_URL, TEST_USERS, BASELINE_OPTIONS } from '../utils/config.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = BASELINE_OPTIONS;

const healthCheckRate = new Rate('health_check_success_rate');
const authRate = new Rate('auth_success_rate');
const studentsRate = new Rate('students_success_rate');
const gradesRate = new Rate('grades_success_rate');
const scheduleRate = new Rate('schedule_success_rate');
const iterations = new Counter('baseline_iterations');

const healthDuration = new Trend('health_check_duration');
const authDuration = new Trend('auth_duration');
const studentsDuration = new Trend('students_duration');
const gradesDuration = new Trend('grades_duration');
const scheduleDuration = new Trend('schedule_duration');

export function setup() {
  console.log('=== Baseline Test Setup ===');
  console.log(`API Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USERS[0].username}`);
  
  const start = Date.now();
  const auth = login(TEST_USERS[0].username, TEST_USERS[0].password);
  
  if (!auth || !auth.accessToken) {
    throw new Error('Setup failed: Could not authenticate');
  }
  
  console.log(`Authentication successful (${Date.now() - start}ms)`);
  
  const headers = getAuthHeaders(auth.accessToken);
  const studentsResponse = http.get(`${BASE_URL}/students?page=1&limit=5`, { headers });
  
  let studentIds = [];
  if (studentsResponse.status === 200) {
    try {
      const body = JSON.parse(studentsResponse.body);
      if (body.data && body.data.length > 0) {
        studentIds = body.data.map(s => s.id);
        console.log(`Found ${studentIds.length} students for testing`);
      }
    } catch (e) {
      console.warn(`Failed to parse students: ${e.message}`);
    }
  }
  
  console.log('=== Setup Complete ===\n');
  
  return { 
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    studentIds: studentIds
  };
}

export default function (data) {
  const headers = getAuthHeaders(data.accessToken);
  
  group('Health Check', () => {
    const start = Date.now();
    const response = http.get(`${BASE_URL}/health`, {
      tags: { name: 'HealthCheck' },
    });
    healthDuration.add(Date.now() - start);

    const success = check(response, {
      'health status is 200': (r) => r.status === 200,
      'health response < 100ms': (r) => r.timings.duration < 100,
    });
    healthCheckRate.add(success);
  });

  sleep(0.5);

  group('Students API', () => {
    const start = Date.now();
    const listResponse = http.get(
      `${BASE_URL}/students?page=1&limit=20&sortBy=lastName&sortDir=asc`,
      {
        headers,
        tags: { name: 'StudentsList' },
      }
    );
    studentsDuration.add(Date.now() - start);

    const success = check(listResponse, {
      'students list status is 200': (r) => r.status === 200,
      'students list has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data);
        } catch {
          return false;
        }
      },
      'students response < 300ms': (r) => r.timings.duration < 300,
    });
    studentsRate.add(success);

    if (success && data.studentIds.length > 0) {
      const studentId = data.studentIds[Math.floor(Math.random() * data.studentIds.length)];
      const detailResponse = http.get(
        `${BASE_URL}/students/${studentId}`,
        {
          headers,
          tags: { name: 'StudentsDetail' },
        }
      );

      check(detailResponse, {
        'student detail status is 200': (r) => r.status === 200,
        'student detail response < 300ms': (r) => r.timings.duration < 300,
      });
    }
  });

  sleep(1);

  group('Grades API', () => {
    if (data.studentIds.length > 0) {
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
        'grades response < 400ms': (r) => r.timings.duration < 400,
      });
      gradesRate.add(success);
    }
  });

  sleep(0.5);

  group('Schedule API', () => {
    const start = Date.now();
    const response = http.get(
      `${BASE_URL}/schedule/student/demo`,
      {
        tags: { name: 'ScheduleDemo' },
      }
    );
    scheduleDuration.add(Date.now() - start);

    const success = check(response, {
      'schedule status is 200': (r) => r.status === 200,
      'schedule has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
      'schedule response < 200ms': (r) => r.timings.duration < 200,
    });
    scheduleRate.add(success);
  });

  iterations.add(1);
  sleep(2);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  return {
    [`tests/load/reports/baseline_${timestamp}.json`]: JSON.stringify(data, null, 2),
    [`tests/load/reports/baseline_${timestamp}.html`]: htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

