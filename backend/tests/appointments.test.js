/**
 * tests/appointments.test.js
 *
 * Integration tests for the appointments + doctors endpoints.
 * Run: npx jest tests/appointments.test.js --forceExit
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt  = require('bcrypt');
const app     = require('../src/app');
const { User, Doctor, DoctorAvailability, Appointment, syncDB } = require('../src/models');

// ─── Shared state ──────────────────────────────────────────────────────────

let patientToken, secretaryToken, doctorToken;
let doctorId, appointmentId;

const hash = (p) => bcrypt.hash(p, 10);

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  // Ensure tomorrow is a weekday (Mon–Fri) since our seed uses Mon–Fri availability
  if (d.getUTCDay() === 0) d.setDate(d.getDate() + 1); // skip Sunday
  if (d.getUTCDay() === 6) d.setDate(d.getDate() + 2); // skip Saturday
  return d.toISOString().split('T')[0];
};

// ─── Setup ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await syncDB({ force: true });

  // Create users
  const [patient, secretary, drUser] = await User.bulkCreate([
    { name: 'Test Patient',   email: 'p@test.com', password: await hash('Patient@123'),   role: 'patient'   },
    { name: 'Test Secretary', email: 's@test.com', password: await hash('Secretary@123'), role: 'secretary' },
    { name: 'Dr. Test',       email: 'd@test.com', password: await hash('Doctor@123'),    role: 'doctor'    },
  ], { individualHooks: false });

  // Create doctor profile
  const doctor = await Doctor.create({
    userId: drUser.id, specialization: 'Orthodontics', yearsExperience: 5,
  });
  doctorId = doctor.id;

  // Mon–Fri availability
  const weekdays = [1, 2, 3, 4, 5];
  await DoctorAvailability.bulkCreate(
    weekdays.map((d) => ({
      doctorId: doctor.id, dayOfWeek: d,
      startTime: '09:00:00', endTime: '17:00:00', slotDuration: 30,
    }))
  );

  // Log everyone in
  const loginAs = async (email, password) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.data.token;
  };
  patientToken   = await loginAs('p@test.com',   'Patient@123');
  secretaryToken = await loginAs('s@test.com',   'Secretary@123');
  doctorToken    = await loginAs('d@test.com',   'Doctor@123');
});

afterAll(async () => {
  const { sequelize } = require('../src/models');
  await sequelize.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctors
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/doctors', () => {
  it('returns list of doctors (public)', async () => {
    const res = await request(app).get('/api/doctors').expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
  });

  it('filters by specialization', async () => {
    const res = await request(app)
      .get('/api/doctors?specialization=Orthodontics')
      .expect(200);
    expect(res.body.data.every((d) => d.specialization.includes('Orthodontics'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctors/:id/slots
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/doctors/:id/slots', () => {
  it('returns free slots for a working day', async () => {
    const res = await request(app)
      .get(`/api/doctors/${doctorId}/slots?date=${tomorrow()}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(res.body.data.isWorkingDay).toBe(true);
    expect(res.body.data.freeSlots.length).toBeGreaterThan(0);
  });

  it('requires authentication', async () => {
    await request(app)
      .get(`/api/doctors/${doctorId}/slots?date=${tomorrow()}`)
      .expect(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/appointments
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/appointments', () => {
  it('patient books a valid appointment', async () => {
    // Get a free slot first
    const slotsRes = await request(app)
      .get(`/api/doctors/${doctorId}/slots?date=${tomorrow()}`)
      .set('Authorization', `Bearer ${patientToken}`);

    const slot = slotsRes.body.data.freeSlots[0];

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        condition       : 'cleaning',
        appointmentDate : tomorrow(),
        timeSlot        : slot,
        notes           : 'First visit',
      })
      .expect(201);

    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.doctor.id).toBe(doctorId);
    appointmentId = res.body.data.id;
  });

  it('rejects booking the same slot twice', async () => {
    const slotsRes = await request(app)
      .get(`/api/doctors/${doctorId}/slots?date=${tomorrow()}`)
      .set('Authorization', `Bearer ${patientToken}`);

    // The slot we just booked is no longer free — pick the first free one and re-use the booked one
    const bookedSlot = (await Appointment.findByPk(appointmentId)).timeSlot;

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        condition       : 'cleaning',
        appointmentDate : tomorrow(),
        timeSlot        : bookedSlot,
      })
      .expect(409);

    expect(res.body.code).toMatch(/CONFLICT/);
  });

  it('rejects a past date', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId,
        condition       : 'crown',
        appointmentDate : '2020-01-01',
        timeSlot        : '9:00 AM',
      })
      .expect(422);

    expect(res.body.errors.some((e) => e.field === 'appointmentDate')).toBe(true);
  });

  it('rejects secretary trying to book', async () => {
    await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${secretaryToken}`)
      .send({ doctorId, condition: 'crown', appointmentDate: tomorrow(), timeSlot: '9:00 AM' })
      .expect(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/appointments/my
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/appointments/my', () => {
  it('patient sees their own appointments', async () => {
    const res = await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].patient).toBeDefined();
  });

  it('rejects secretary accessing /my', async () => {
    await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${secretaryToken}`)
      .expect(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/appointments  (secretary)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/appointments (secretary)', () => {
  it('secretary sees all appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${secretaryToken}`)
      .expect(200);

    expect(res.body.pagination.total).toBeGreaterThan(0);
  });

  it('secretary can filter by status', async () => {
    const res = await request(app)
      .get('/api/appointments?status=pending')
      .set('Authorization', `Bearer ${secretaryToken}`)
      .expect(200);

    expect(res.body.data.every((a) => a.status === 'pending')).toBe(true);
  });

  it('patient cannot access full list', async () => {
    await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/appointments/:id/confirm
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/appointments/:id/confirm', () => {
  it('secretary confirms an appointment', async () => {
    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}/confirm`)
      .set('Authorization', `Bearer ${secretaryToken}`)
      .expect(200);

    expect(res.body.data.status).toBe('confirmed');
    expect(res.body.data.confirmedBy).toBeDefined();
  });

  it('cannot confirm an already-confirmed appointment', async () => {
    await request(app)
      .patch(`/api/appointments/${appointmentId}/confirm`)
      .set('Authorization', `Bearer ${secretaryToken}`)
      .expect(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/appointments/:id/complete
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/appointments/:id/complete', () => {
  it('secretary marks confirmed appointment as completed', async () => {
    const res = await request(app)
      .patch(`/api/appointments/${appointmentId}/complete`)
      .set('Authorization', `Bearer ${secretaryToken}`)
      .expect(200);

    expect(res.body.data.status).toBe('completed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/appointments/:id/reject
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/appointments/:id/reject', () => {
  let secondApptId;

  beforeAll(async () => {
    const slotsRes = await request(app)
      .get(`/api/doctors/${doctorId}/slots?date=${tomorrow()}`)
      .set('Authorization', `Bearer ${patientToken}`);
    const slot = slotsRes.body.data.freeSlots[0];

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId, condition: 'extraction', appointmentDate: tomorrow(), timeSlot: slot });
    secondApptId = res.body.data.id;
  });

  it('secretary rejects with a reason', async () => {
    const res = await request(app)
      .patch(`/api/appointments/${secondApptId}/reject`)
      .set('Authorization', `Bearer ${secretaryToken}`)
      .send({ reason: 'Doctor is on leave that day.' })
      .expect(200);

    expect(res.body.data.status).toBe('rejected');
    expect(res.body.data.rejectedReason).toBe('Doctor is on leave that day.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctor/schedule
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/doctor/schedule', () => {
  it('doctor sees their schedule', async () => {
    const res = await request(app)
      .get('/api/doctor/schedule')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('patient cannot access doctor schedule', async () => {
    await request(app)
      .get('/api/doctor/schedule')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(403);
  });
});
