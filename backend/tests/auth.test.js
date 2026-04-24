/**
 * tests/auth.test.js
 *
 * Integration tests for the Auth module.
 * Runs against a real test database (DB_NAME_TEST).
 *
 * Prerequisites:
 *   1. Create a test DB:  createdb dental_clinic_test
 *   2. Set DB_NAME_TEST in .env (or it defaults to dental_clinic_test)
 *   3. Run:  npx jest tests/auth.test.js --forceExit
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt  = require('bcrypt');
const app     = require('../src/app');
const { User, syncDB } = require('../src/models');

// ─── Helpers ───────────────────────────────────────────────────────────────

const PATIENT = {
  name     : 'Test Patient',
  email    : 'patient@test.com',
  password : 'Patient@123',
  phone    : '+970591000099',
};

let authToken = '';

// ─── Setup / Teardown ──────────────────────────────────────────────────────

beforeAll(async () => {
  // Wipe and recreate tables for a clean test run
  await syncDB({ force: true });
});

afterAll(async () => {
  const { sequelize } = require('../src/models');
  await sequelize.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates a new patient account and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(PATIENT)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('patient');
    expect(res.body.data.user.password).toBeUndefined();  // never exposed
    authToken = res.body.data.token;
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(PATIENT)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('rejects weak password with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...PATIENT, email: 'other@test.com', password: 'weak' })
      .expect(422);

    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('rejects missing email with 422', async () => {
    const { email: _omit, ...noEmail } = PATIENT;
    const res = await request(app)
      .post('/api/auth/register')
      .send(noEmail)
      .expect(422);

    expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: PATIENT.email, password: PATIENT.password })
      .expect(200);

    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(PATIENT.email);
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: PATIENT.email, password: 'WrongPass@1' })
      .expect(401);

    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: PATIENT.password })
      .expect(401);

    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data.email).toBe(PATIENT.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('returns 401 without token', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('returns 401 with malformed token', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.token')
      .expect(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/auth/me', () => {
  it('updates the user name', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Sara Updated' })
      .expect(200);

    expect(res.body.data.name).toBe('Sara Updated');
  });

  it('rejects an invalid avatar URL', async () => {
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ avatarUrl: 'not-a-url' })
      .expect(422);

    expect(res.body.errors.some((e) => e.field === 'avatarUrl')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/me/password
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/auth/me/password', () => {
  const newPassword = 'NewPassword@999';

  it('changes the password successfully', async () => {
    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword    : PATIENT.password,
        newPassword,
        confirmNewPassword : newPassword,
      })
      .expect(200);

    expect(res.body.data.token).toBeDefined();
  });

  it('can log in with the new password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: PATIENT.email, password: newPassword })
      .expect(200);

    expect(res.body.data.token).toBeDefined();
  });

  it('rejects wrong current password', async () => {
    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword    : 'WrongCurrent@1',
        newPassword        : 'Another@999',
        confirmNewPassword : 'Another@999',
      })
      .expect(401);

    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects mismatched confirm password', async () => {
    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword    : newPassword,
        newPassword        : 'Match@1234',
        confirmNewPassword : 'NoMatch@999',
      })
      .expect(422);

    expect(res.body.errors.some((e) => e.field === 'confirmNewPassword')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/staff/login
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/staff/login', () => {
  let secretaryEmail;

  beforeAll(async () => {
    // Create a secretary directly (bypass public register)
    const hash = await bcrypt.hash('Secretary@123', 10);
    const sec  = await User.create({
      name     : 'Test Secretary',
      email    : 'sec@test.com',
      password : hash,
      role     : 'secretary',
    });
    secretaryEmail = sec.email;
  });

  it('allows secretary to log in via staff portal', async () => {
    const res = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: secretaryEmail, password: 'Secretary@123' })
      .expect(200);

    expect(res.body.data.user.role).toBe('secretary');
  });

  it('rejects a patient using the staff portal', async () => {
    const res = await request(app)
      .post('/api/auth/staff/login')
      .send({ email: PATIENT.email, password: 'anything' })
      .expect(401);

    expect(res.body.message).toMatch(/staff only/i);
  });
});
