# 📋 PHASE 2 IMPLEMENTATION PLAN
## Testing & Quality

**Phase:** 2 of 4  
**Duration:** Week 3-5 (3 weeks)  
**Start Date:** After Phase 1 manual testing  
**Goal:** 80%+ code coverage, E2E tests, load testing  
**Status:** 📋 Ready to Start

---

## 🎯 PHASE 2 OBJECTIVES

1. **Unit Tests:** 80%+ code coverage for backend
2. **Integration Tests:** All critical workflows tested
3. **E2E Tests:** Main user flows automated
4. **Load Tests:** System performance documented
5. **CI Pipeline:** Tests run automatically on PR

---

## 📊 WEEK-BY-WEEK BREAKDOWN

### Week 3: Unit Tests Setup & Auth Testing

#### Day 1-2: Jest Configuration

**Tasks:**
- [ ] Install Jest & dependencies
- [ ] Create `jest.config.js`
- [ ] Setup test database (MongoDB in-memory or test container)
- [ ] Create test fixtures (users, incidents)
- [ ] Write first test (health check endpoint)

**Files to Create:**
```
backend/
├── jest.config.js
├── setupTests.js
└── tests/
    ├── fixtures/
    │   ├── users.js
    │   └── incidents.js
    └── helpers/
        └── testDb.js
```

**Dependencies:**
```json
{
  "devDependencies": {
    "jest": "^29.6.2",
    "supertest": "^6.3.3",
    "mongodb-memory-server": "^9.0.0"
  }
}
```

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'server.js',
    'routes/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!node_modules'
  ],
  coverageDirectory: 'coverage',
  testTimeout: 30000
};
```

---

#### Day 3-5: Auth Routes Tests

**Test File:** `backend/tests/unit/routes/auth.test.js`

**Tests to Write:**

| Test | Description | Expected |
|------|-------------|----------|
| POST /api/auth/register (valid) | Register with strong password | 201 Created |
| POST /api/auth/register (weak password) | Register with weak password | 400 Bad Request |
| POST /api/auth/register (duplicate email) | Register existing email | 400 Bad Request |
| POST /api/auth/login (valid) | Login with correct credentials | 200 OK + token |
| POST /api/auth/login (invalid password) | Login with wrong password | 401 Unauthorized |
| POST /api/auth/login (non-existent email) | Login with unknown email | 401 Unauthorized |
| GET /api/auth/me | Get current user profile | 200 OK + user data |
| PUT /api/auth/change-password | Change password successfully | 200 OK |
| PUT /api/auth/change-password (wrong current) | Change with wrong current password | 401 Unauthorized |

**Test Example:**
```javascript
const request = require('supertest');
const { app, server } = require('../../../server');
const User = require('../../../models/User');
const { connectDB, closeDB, clearDB } = require('../../helpers/testDb');

describe('Authentication Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  afterAll(async () => {
    await closeDB();
    server.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak123',
        firstName: 'Test',
        lastName: 'User'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
```

---

### Week 4: Incident & Alert Tests

#### Day 1-3: Incident CRUD Tests

**Test File:** `backend/tests/unit/routes/incidents.test.js`

**Tests to Write:**

| Test | Description | Expected |
|------|-------------|----------|
| GET /api/incidents | Get all incidents | 200 OK + array |
| GET /api/incidents/:id | Get specific incident | 200 OK + data |
| POST /api/incidents (valid) | Create incident with valid data | 201 Created |
| POST /api/incidents (invalid) | Create with missing title | 400 Bad Request |
| PUT /api/incidents/:id | Update incident status | 200 OK |
| DELETE /api/incidents/:id | Delete incident | 200 OK |

---

#### Day 4-5: Alert Webhook & Middleware Tests

**Test Files:**
- `backend/tests/unit/routes/alerts.test.js`
- `backend/tests/unit/middleware/auth.test.js`
- `backend/tests/unit/middleware/validator.test.js`

**Alert Webhook Tests:**

```javascript
describe('POST /api/alerts/webhook', () => {
  it('should create incident from webhook', async () => {
    const alertData = {
      rule_name: 'SSH Bruteforce',
      severity: 'high',
      source_ip: '192.168.1.100',
      category: 'network_intrusion'
    };

    const res = await request(app)
      .post('/api/alerts/webhook')
      .send(alertData);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBeDefined();
  });

  it('should handle empty payload gracefully', async () => {
    const res = await request(app)
      .post('/api/alerts/webhook')
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

**Middleware Tests:**

```javascript
describe('Authentication Middleware', () => {
  it('should reject requests without token', async () => {
    const res = await request(app)
      .get('/api/incidents');

    expect(res.statusCode).toBe(401);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res.statusCode).toBe(401);
  });
});
```

---

### Week 5: E2E Tests & Load Testing

#### Day 1-2: Cypress Setup

**Install Cypress:**
```bash
cd security-elk
npm install --save-dev cypress
npx cypress open
```

**Directory Structure:**
```
tests/
└── cypress/
    ├── cypress.config.js
    └── e2e/
        ├── login.cy.js
        ├── dashboard.cy.js
        ├── incidents.cy.js
        └── alerts.cy.js
```

---

#### Day 3-4: E2E Test Scenarios

**Test 1: Login Flow** (`login.cy.js`)
```javascript
describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login with valid credentials', () => {
    cy.get('[data-testid=email]').type('admin@security.local');
    cy.get('[data-testid=password]').type('admin123');
    cy.get('[data-testid=submit]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.get('[data-testid=email]').type('wrong@email.com');
    cy.get('[data-testid=password]').type('wrongpassword');
    cy.get('[data-testid=submit]').click();

    cy.contains('Thông tin đăng nhập không hợp lệ').should('be.visible');
  });
});
```

**Test 2: Create Incident** (`incidents.cy.js`)
```javascript
describe('Incident Management', () => {
  beforeEach(() => {
    cy.login(); // Custom command
    cy.visit('/incidents');
  });

  it('should create new incident', () => {
    cy.get('[data-testid=create-incident]').click();
    
    cy.get('[data-testid=title]').type('Test Incident');
    cy.get('[data-testid=description]').type('This is a test incident');
    cy.get('[data-testid=severity]').select('high');
    cy.get('[data-testid=category]').select('malware');
    cy.get('[data-testid=submit]').click();

    cy.contains('Test Incident').should('be.visible');
    cy.contains('high').should('be.visible');
  });
});
```

---

#### Day 5: Load Testing

**Tool:** Artillery.io

**Install:**
```bash
npm install -g artillery
```

**Load Test Config** (`load-test.yml`):
```yaml
config:
  target: "http://localhost:5001"
  phases:
    - duration: 60
      arrivalRate: 5
      rampTo: 50
      name: "Ramp up load"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  - name: "Login and get incidents"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "admin@security.local"
            password: "admin123"
          capture:
            - json: "$.token"
              as: "token"
      - get:
          url: "/api/incidents"
          headers:
            Authorization: "Bearer {{token}}"
```

**Run Load Test:**
```bash
artillery run load-test.yml
artillery report load-test-report.json
```

**Metrics to Document:**
- Average response time
- P95 response time
- P99 response time
- Requests per second
- Error rate
- Max concurrent users supported

---

## 📊 SUCCESS CRITERIA

### Must Have (80%+)
- [ ] 80%+ unit test coverage
- [ ] All auth routes tested
- [ ] All incident CRUD tested
- [ ] Webhook tested
- [ ] Middleware tested
- [ ] E2E login flow working
- [ ] E2E incident creation working
- [ ] Load test: 100 concurrent users
- [ ] Load test: <1s response time (P95)

### Nice to Have
- [ ] 90%+ unit test coverage
- [ ] All dashboard routes tested
- [ ] E2E alert flow working
- [ ] Load test: 500 concurrent users
- [ ] Load test: <500ms response time (P95)
- [ ] CI pipeline operational

---

## 🔧 TECHNICAL SETUP

### Test Database Strategy

**Option 1: MongoDB Memory Server** (Recommended)
```javascript
// tests/helpers/testDb.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

async function connectDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

async function closeDB() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
}

module.exports = { connectDB, closeDB, clearDB };
```

**Option 2: Docker Test Container**
```bash
# Run MongoDB test container
docker run -d --name test-mongo -p 27018:27017 mongo:6.0

# Use in tests
MONGODB_URI=mongodb://localhost:27018/test_db
```

---

## 📝 CI/CD PIPELINE (End of Phase 2)

**GitHub Actions Workflow** (`.github/workflows/ci.yml`):

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
```

---

## 📅 DELIVERABLES

### Week 3
- [ ] Jest configuration
- [ ] Test fixtures
- [ ] Auth routes tests (9 tests)
- [ ] Coverage report (40%+)

### Week 4
- [ ] Incident CRUD tests (6 tests)
- [ ] Alert webhook tests (3 tests)
- [ ] Middleware tests (4 tests)
- [ ] Coverage report (70%+)

### Week 5
- [ ] Cypress setup
- [ ] E2E tests (4 scenarios)
- [ ] Load test completed
- [ ] Final coverage report (80%+)
- [ ] CI pipeline operational

---

## 🎯 TRANSITION TO PHASE 3

**Phase 2 Complete When:**
- ✅ 80%+ code coverage achieved
- ✅ All critical paths tested
- ✅ E2E tests passing
- ✅ Load test documented
- ✅ CI pipeline runs on every PR

**Phase 3 Preview:** AI Integration
- AI microservice setup (FastAPI)
- Alert classification model
- Anomaly detection (Elasticsearch ML)
- Response suggestions engine
- Frontend AI features

---

**Ready to start Phase 2?** 🚀 Let me know and I'll begin implementing the tests immediately!