# API Contract Testing Standards

## Overview

This document defines the API contract testing strategy for the Mi Campus SaaS backend. All API endpoints are tested using Supertest for integration testing to ensure contract compliance, proper error handling, and security.

## Test Coverage Requirements

### Coverage Thresholds

| Category                           | Target Coverage | Minimum Coverage |
| ---------------------------------- | --------------- | ---------------- |
| **API Endpoints (E2E)**            | 90%             | 80%              |
| **Unit Tests (Services)**          | 85%             | 75%              |
| **Critical Paths (Auth, Finance)** | 100%            | 95%              |
| **Overall Code Coverage**          | 85%             | 75%              |

### Critical Paths Requiring 100% Coverage

1. **Authentication & Authorization**
   - Login/logout flows
   - Token refresh mechanism
   - 2FA verification
   - Password reset flows
   - Role-based access control

2. **Financial Transactions**
   - Payment processing
   - Invoice creation
   - Idempotency handling
   - Payment reconciliation

3. **Student Data**
   - Student CRUD operations
   - GPA calculations
   - Grade management

## Test Organization

### Test Files

Each controller has a corresponding E2E test file:

```text
apps/backend/test/
├── auth.e2e-spec.ts           # Authentication endpoints
├── students.e2e-spec.ts        # Student management
├── teachers.e2e-spec.ts        # Teacher management
├── classes.e2e-spec.ts         # Class management
├── grades.e2e-spec.ts          # Grades & GPA
├── attendance.e2e-spec.ts      # Attendance tracking
├── announcements.e2e-spec.ts   # Announcements
├── finance.e2e-spec.ts         # Fees & payments
└── app.e2e-spec.ts            # Health check
```

## Testing Patterns

### 1. Success Cases

Every endpoint must test:

- **Happy path with valid data**
- **Expected response structure**
- **Correct status codes**
- **Response data validation**

Example:

```typescript
it('should create student for admin', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/students')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(validStudentData)
    .expect(201);

  expect(response.body).toHaveProperty('id');
  expect(response.body.firstName).toBe('Alice');
});
```

### 2. Error Cases

Every endpoint must test:

- **Missing required fields** → 400 Bad Request
- **Invalid data types** → 400 Bad Request
- **Invalid UUIDs** → 400 Bad Request
- **Non-existent resources** → 404 Not Found
- **Unauthorized access** → 401 Unauthorized
- **Insufficient permissions** → 403 Forbidden

Example:

```typescript
it('should fail with missing required fields', async () => {
  await request(app.getHttpServer())
    .post('/api/students')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ firstName: 'Bob' }) // Missing lastName, etc.
    .expect(400);
});
```

### 3. Authentication & Authorization

Every protected endpoint must test:

- **No token provided** → 401
- **Invalid token** → 401
- **Expired token** → 401
- **Insufficient role** → 403

Example:

```typescript
it('should fail without authentication', async () => {
  await request(app.getHttpServer()).get('/api/students').expect(401);
});

it('should fail for student role', async () => {
  await request(app.getHttpServer()).get('/api/students').set('Authorization', `Bearer ${studentToken}`).expect(403);
});
```

### 4. Pagination & Filtering

Endpoints with pagination must test:

- **Default pagination** (page=1, limit=20)
- **Custom pagination parameters**
- **Search/query filtering**
- **Sorting parameters**
- **Response structure** (data, total, page, limit)

Example:

```typescript
it('should support pagination parameters', async () => {
  const response = await request(app.getHttpServer())
    .get('/api/students?page=1&limit=10')
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(200);

  expect(response.body.page).toBe(1);
  expect(response.body.limit).toBe(10);
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('total');
});
```

### 5. Data Validation

Test validation rules:

- **Email format validation**
- **Phone number formats**
- **Date formats**
- **Numeric ranges**
- **String length constraints**
- **Required vs optional fields**

### 6. Business Logic

Test business rules:

- **GPA calculations**
- **Payment idempotency**
- **Grade weight calculations**
- **Attendance status rules**
- **Date range validations**

## Test Data Management

### Setup and Teardown

```typescript
beforeAll(async () => {
  // Initialize app and database
  app = moduleFixture.createNestApplication();
  await app.init();

  // Clear existing data
  await dataSource.query('DELETE FROM student');
  await dataSource.query('DELETE FROM user');

  // Create test users with different roles
  // Create test data (students, classes, etc.)
  // Login to get tokens
});

afterAll(async () => {
  // Clean up test data
  await dataSource.query('DELETE FROM student');
  await dataSource.query('DELETE FROM user');
  await app.close();
});
```

### Test Isolation

- Each test file manages its own test data
- Use unique data per test when possible
- Clean up after tests complete
- Use transactions for complex multi-step operations

## Security Testing

### Required Security Tests

1. **Authentication bypass attempts**
2. **Role escalation attempts**
3. **Resource ownership validation**
4. **SQL injection prevention**
5. **XSS prevention**
6. **File upload security** (extensions, MIME types)
7. **Rate limiting**

Example:

```typescript
it('should prevent access to other users resources', async () => {
  await request(app.getHttpServer())
    .get(`/api/students/${otherStudentId}/gpa`)
    .set('Authorization', `Bearer ${studentToken}`)
    .expect(403);
});
```

## Performance Testing

### Response Time Expectations

| Endpoint Type | Target  | Maximum |
| ------------- | ------- | ------- |
| GET (list)    | < 200ms | < 500ms |
| GET (detail)  | < 100ms | < 200ms |
| POST/PATCH    | < 300ms | < 1s    |
| File upload   | < 2s    | < 5s    |

### Load Testing Scenarios

1. **Concurrent user requests**
2. **Pagination stress tests**
3. **Large file uploads**
4. **Batch operations**

## Running Tests

### Commands

```bash
# Run all E2E tests
yarn --cwd apps/backend test:e2e

# Run specific test file
yarn --cwd apps/backend test:e2e auth.e2e-spec

# Run with coverage
yarn --cwd apps/backend test:cov

# Watch mode
yarn --cwd apps/backend test:watch
```

### CI/CD Integration

Tests run automatically on:

- Every push to feature branches
- Pull requests to develop/main
- Scheduled nightly builds

### Coverage Reports

Coverage reports are:

- Generated after every test run
- Stored in `apps/backend/coverage/`
- Uploaded to SonarQube for analysis
- Fail CI if below minimum thresholds

## Best Practices

### DO

✅ Test both success and error paths  
✅ Use meaningful test descriptions  
✅ Test all HTTP status codes  
✅ Validate response structure  
✅ Test authentication and authorization  
✅ Clean up test data  
✅ Use realistic test data  
✅ Test edge cases  
✅ Mock external services  
✅ Test business logic validations

### DON'T

❌ Test implementation details  
❌ Share state between tests  
❌ Use production data  
❌ Skip error cases  
❌ Test multiple things in one test  
❌ Hardcode sensitive data  
❌ Ignore flaky tests  
❌ Skip cleanup  
❌ Test what's already tested by framework

## Acceptance Criteria

A test suite is considered complete when:

1. ✅ All success paths are tested
2. ✅ All error paths are tested
3. ✅ Authentication/authorization is tested
4. ✅ Data validation is tested
5. ✅ Business rules are tested
6. ✅ Pagination/filtering is tested
7. ✅ Response structure is validated
8. ✅ Coverage thresholds are met
9. ✅ No failing tests
10. ✅ No flaky tests

## Maintenance

### Regular Updates

- Review and update tests when APIs change
- Add tests for new endpoints immediately
- Refactor tests to reduce duplication
- Update coverage thresholds quarterly
- Review and fix flaky tests weekly

### Test Quality Metrics

Track:

- **Test count per controller**
- **Coverage percentage**
- **Test execution time**
- **Flaky test rate**
- **Test maintenance cost**

## Conclusion

API contract testing is critical for:

- Ensuring API reliability
- Preventing regressions
- Documenting expected behavior
- Enabling confident refactoring
- Supporting CI/CD pipelines

All developers must:

1. Write tests for new endpoints
2. Update tests when changing existing endpoints
3. Maintain coverage thresholds
4. Fix failing tests immediately
5. Review test quality in code reviews
