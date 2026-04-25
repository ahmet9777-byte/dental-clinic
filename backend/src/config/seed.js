/**
 * seed.js — نسخة كبيرة ومتنوعة
 * 8 دكاترة، 15 مريض، 50+ موعد
 * تشغيل: npm run seed
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt        = require('bcrypt');

const SALT_ROUNDS = 10;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host    : process.env.DB_HOST || 'localhost',
    port    : process.env.DB_PORT || 5432,
    dialect : 'postgres',
    logging : false,
    dialectOptions: {
      ssl: process.env.DB_HOST && process.env.DB_HOST.includes('supabase')
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  }
);

function nextWeekday(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function pastWeekday(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅  Connected to PostgreSQL');
  } catch (err) {
    console.error('❌  Cannot connect:', err.message);
    process.exit(1);
  }

  console.log('🧹  Clearing old data...');
  await sequelize.query('DELETE FROM appointments');
  await sequelize.query('DELETE FROM doctor_availability');
  await sequelize.query('DELETE FROM doctors');
  await sequelize.query('DELETE FROM users');
  await sequelize.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  await sequelize.query('ALTER SEQUENCE doctors_id_seq RESTART WITH 1');
  await sequelize.query('ALTER SEQUENCE doctor_availability_id_seq RESTART WITH 1');
  await sequelize.query('ALTER SEQUENCE appointments_id_seq RESTART WITH 1');

  console.log('🔐  Hashing passwords...');
  const pwSec = await bcrypt.hash('Secretary@123', SALT_ROUNDS);
  const pwDoc = await bcrypt.hash('Doctor@123',    SALT_ROUNDS);
  const pwPat = await bcrypt.hash('Patient@123',   SALT_ROUNDS);

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👥  Creating users...');
  await sequelize.query(
    `INSERT INTO users (name, email, password, role, phone, is_active, created_at, updated_at) VALUES
      -- سكرتيرتان
      ('Nour Al-Admin',        'secretary@dentacare.com',   $1, 'secretary', '+970591000001', true, NOW(), NOW()),
      ('Lara Hamdan',          'lara@dentacare.com',        $1, 'secretary', '+970591000002', true, NOW(), NOW()),
      -- 8 دكاترة
      ('Dr. Yousef Haddad',    'yousef@dentacare.com',      $2, 'doctor',    '+970591000010', true, NOW(), NOW()),
      ('Dr. Amira Nasser',     'amira@dentacare.com',       $2, 'doctor',    '+970591000011', true, NOW(), NOW()),
      ('Dr. Khalid Mansour',   'khalid@dentacare.com',      $2, 'doctor',    '+970591000012', true, NOW(), NOW()),
      ('Dr. Lina Barakat',     'lina@dentacare.com',        $2, 'doctor',    '+970591000013', true, NOW(), NOW()),
      ('Dr. Sami Odeh',        'sami@dentacare.com',        $2, 'doctor',    '+970591000014', true, NOW(), NOW()),
      ('Dr. Reem Zohbi',       'reem@dentacare.com',        $2, 'doctor',    '+970591000015', true, NOW(), NOW()),
      ('Dr. Tariq Musleh',     'tariq.doc@dentacare.com',   $2, 'doctor',    '+970591000016', true, NOW(), NOW()),
      ('Dr. Hana Abu Saleh',   'hana.doc@dentacare.com',    $2, 'doctor',    '+970591000017', true, NOW(), NOW()),
      -- 15 مريض
      ('Sara Khalil',          'sara@example.com',          $3, 'patient',   '+970591000020', true, NOW(), NOW()),
      ('Ahmed Dahdouh',        'ahmed@example.com',         $3, 'patient',   '+970591000021', true, NOW(), NOW()),
      ('Rania Saleh',          'rania@example.com',         $3, 'patient',   '+970591000022', true, NOW(), NOW()),
      ('Omar Hamdan',          'omar@example.com',          $3, 'patient',   '+970591000023', true, NOW(), NOW()),
      ('Fatima Jaber',         'fatima@example.com',        $3, 'patient',   '+970591000024', true, NOW(), NOW()),
      ('Tariq Abu Zaid',       'tariq@example.com',         $3, 'patient',   '+970591000025', true, NOW(), NOW()),
      ('Hana Musleh',          'hana@example.com',          $3, 'patient',   '+970591000026', true, NOW(), NOW()),
      ('Malik Odeh',           'malik@example.com',         $3, 'patient',   '+970591000027', true, NOW(), NOW()),
      ('Dina Shahin',          'dina@example.com',          $3, 'patient',   '+970591000028', true, NOW(), NOW()),
      ('Karim Nassar',         'karim@example.com',         $3, 'patient',   '+970591000029', true, NOW(), NOW()),
      ('Layla Barghouthi',     'layla@example.com',         $3, 'patient',   '+970591000030', true, NOW(), NOW()),
      ('Ziad Khoury',          'ziad@example.com',          $3, 'patient',   '+970591000031', true, NOW(), NOW()),
      ('Nadia Samhan',         'nadia@example.com',         $3, 'patient',   '+970591000032', true, NOW(), NOW()),
      ('Bassam Arafat',        'bassam@example.com',        $3, 'patient',   '+970591000033', true, NOW(), NOW()),
      ('Iman Khalidi',         'iman@example.com',          $3, 'patient',   '+970591000034', true, NOW(), NOW())`,
    { bind: [pwSec, pwDoc, pwPat] }
  );

  const users = await sequelize.query(
    'SELECT id, name, role, email FROM users ORDER BY id',
    { type: sequelize.QueryTypes.SELECT }
  );

  const secretaries = users.filter(u => u.role === 'secretary');
  const docUsers    = users.filter(u => u.role === 'doctor');
  const patUsers    = users.filter(u => u.role === 'patient');
  const secretary   = secretaries[0];

  console.log(`   ✓ ${users.length} users (${secretaries.length} secretaries, ${docUsers.length} doctors, ${patUsers.length} patients)`);

  // ── Doctor profiles ────────────────────────────────────────────────────────
  console.log('🩺  Creating doctor profiles...');

  const doctorData = [
    { name: 'Dr. Yousef Haddad',  spec: 'Orthodontics',         bio: 'Specialist in braces and dental alignment with 12 years of experience.',              exp: 12 },
    { name: 'Dr. Amira Nasser',   spec: 'Endodontics',          bio: 'Expert in root canal therapy and tooth preservation with 8 years of practice.',        exp: 8  },
    { name: 'Dr. Khalid Mansour', spec: 'Prosthodontics',       bio: 'Specialist in crowns, bridges, dentures and implant restorations.',                    exp: 10 },
    { name: 'Dr. Lina Barakat',   spec: 'Pediatric Dentistry',  bio: 'Dedicated to making dental visits fun and stress-free for children.',                  exp: 6  },
    { name: 'Dr. Sami Odeh',      spec: 'Oral Surgery',         bio: 'Experienced oral surgeon specializing in extractions, implants, and jaw surgery.',     exp: 14 },
    { name: 'Dr. Reem Zohbi',     spec: 'Periodontics',         bio: 'Specialist in gum disease treatment and prevention with a gentle approach.',           exp: 9  },
    { name: 'Dr. Tariq Musleh',   spec: 'Cosmetic Dentistry',   bio: 'Expert in teeth whitening, veneers, and smile makeovers.',                            exp: 7  },
    { name: 'Dr. Hana Abu Saleh', spec: 'General Dentistry',    bio: 'Experienced general dentist providing comprehensive care for the whole family.',       exp: 11 },
  ];

  for (const dd of doctorData) {
    const u = docUsers.find(u => u.name === dd.name);
    await sequelize.query(
      `INSERT INTO doctors (user_id, specialization, bio, years_experience, is_available, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
      { bind: [u.id, dd.spec, dd.bio, dd.exp] }
    );
  }

  const docRows = await sequelize.query(
    'SELECT id, user_id FROM doctors ORDER BY id',
    { type: sequelize.QueryTypes.SELECT }
  );

  console.log(`   ✓ ${docRows.length} doctor profiles`);

  // ── Availability ───────────────────────────────────────────────────────────
  console.log('📅  Setting availability...');

  const schedules = [
    { idx: 0, days: [1,2,3,4,5], start: '09:00:00', end: '17:00:00', dur: 30 }, // يوسف: إثنين-جمعة
    { idx: 1, days: [0,1,2,3,4], start: '08:00:00', end: '16:00:00', dur: 30 }, // أميرة: أحد-خميس
    { idx: 2, days: [1,3,5],     start: '10:00:00', end: '18:00:00', dur: 45 }, // خالد: إثنين،أربعاء،جمعة
    { idx: 3, days: [2,3,4,5,6], start: '09:00:00', end: '15:00:00', dur: 30 }, // لينا: ثلاثاء-سبت
    { idx: 4, days: [1,2,3,4,5], start: '08:00:00', end: '14:00:00', dur: 30 }, // سامي: إثنين-جمعة صباحاً
    { idx: 5, days: [0,1,2,3,4], start: '11:00:00', end: '19:00:00', dur: 30 }, // ريم: أحد-خميس مساءً
    { idx: 6, days: [1,3,5,6],   start: '10:00:00', end: '16:00:00', dur: 30 }, // طارق: إثنين،أربعاء،جمعة،سبت
    { idx: 7, days: [0,1,2,3,4,5], start: '09:00:00', end: '17:00:00', dur: 30 }, // هناء: أحد-جمعة
  ];

  for (const s of schedules) {
    const docId = docRows[s.idx].id;
    for (const day of s.days) {
      await sequelize.query(
        `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        { bind: [docId, day, s.start, s.end, s.dur] }
      );
    }
  }

  console.log('   ✓ Availability set for all 8 doctors');

  // ── Appointments ───────────────────────────────────────────────────────────
  console.log('📋  Creating appointments...');

  const conditions = ['crown','cleaning','extraction','braces','rootcanal','other'];
  const slots = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
                 '12:00 PM','01:00 PM','01:30 PM','02:00 PM','02:30 PM','03:00 PM'];

  let apptCount = 0;
  const usedSlots = new Set();

  const makeAppt = async (patId, docId, condition, date, slot, notes, status, secId = null, reason = null) => {
    const key = `${docId}-${date}-${slot}`;
    if (usedSlots.has(key)) return;
    usedSlots.add(key);

    if (status === 'pending') {
      await sequelize.query(
        `INSERT INTO appointments (patient_id, doctor_id, condition, appointment_date, time_slot, notes, status, email_sent, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,'pending',false,NOW(),NOW())`,
        { bind: [patId, docId, condition, date, slot, notes] }
      );
    } else if (status === 'confirmed') {
      await sequelize.query(
        `INSERT INTO appointments (patient_id, doctor_id, condition, appointment_date, time_slot, notes, status, email_sent, confirmed_by, confirmed_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,'confirmed',true,$7,NOW(),NOW(),NOW())`,
        { bind: [patId, docId, condition, date, slot, notes, secId] }
      );
    } else if (status === 'completed') {
      await sequelize.query(
        `INSERT INTO appointments (patient_id, doctor_id, condition, appointment_date, time_slot, notes, status, email_sent, confirmed_by, confirmed_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,'completed',true,$7,NOW(),NOW(),NOW())`,
        { bind: [patId, docId, condition, date, slot, notes, secId] }
      );
    } else if (status === 'rejected') {
      await sequelize.query(
        `INSERT INTO appointments (patient_id, doctor_id, condition, appointment_date, time_slot, notes, status, email_sent, rejected_reason, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,'rejected',false,$7,NOW(),NOW())`,
        { bind: [patId, docId, condition, date, slot, notes, reason || 'Doctor unavailable on selected date.'] }
      );
    }
    apptCount++;
  };

  // مواعيد قادمة - pending (20 موعد)
  const pendingData = [
    [0,0,'braces',    1,  '09:00 AM', 'First consultation for braces.'],
    [1,1,'rootcanal', 2,  '10:00 AM', 'Severe tooth pain for a week.'],
    [2,2,'crown',     2,  '11:00 AM', 'Crown replacement needed.'],
    [3,3,'cleaning',  3,  '09:00 AM', 'Regular 6-month cleaning.'],
    [4,0,'braces',    3,  '10:30 AM', 'Follow-up for braces treatment.'],
    [5,4,'extraction',4,  '09:00 AM', 'Wisdom tooth extraction.'],
    [6,5,'other',     5,  '11:00 AM', 'Gum sensitivity issue.'],
    [7,6,'cleaning',  5,  '10:00 AM', 'Teeth whitening consultation.'],
    [8,7,'crown',     6,  '09:30 AM', 'General checkup and cleaning.'],
    [9,1,'rootcanal', 6,  '11:00 AM', 'Second opinion on root canal.'],
    [10,2,'other',    7,  '10:00 AM', 'Dental implant consultation.'],
    [11,3,'cleaning', 7,  '09:00 AM', 'Pediatric dental checkup.'],
    [12,4,'braces',   8,  '10:30 AM', 'Retainer fitting.'],
    [13,5,'crown',    8,  '11:00 AM', 'Crown on upper right molar.'],
    [14,6,'cleaning', 9,  '09:00 AM', 'Cosmetic cleaning session.'],
    [0,7,'other',     9,  '10:00 AM', 'Routine family checkup.'],
    [1,0,'cleaning',  10, '09:30 AM', 'Deep cleaning required.'],
    [2,4,'extraction',10, '11:00 AM', 'Lower molar extraction.'],
    [3,6,'other',     11, '10:00 AM', 'Smile makeover consultation.'],
    [4,7,'braces',    12, '09:00 AM', 'Braces progress check.'],
  ];

  for (const [pIdx,dIdx,cond,off,slot,notes] of pendingData) {
    await makeAppt(patUsers[pIdx].id, docRows[dIdx].id, cond, nextWeekday(off), slot, notes, 'pending');
  }

  // مواعيد مؤكدة - confirmed (15 موعد)
  const confirmedData = [
    [5,0,'braces',    14, '09:00 AM', 'Monthly braces adjustment.'],
    [6,1,'rootcanal', 14, '10:00 AM', 'Root canal second session.'],
    [7,2,'crown',     15, '11:00 AM', 'Crown fitting appointment.'],
    [8,3,'cleaning',  15, '09:00 AM', 'Pediatric cleaning.'],
    [9,4,'extraction',16, '10:30 AM', 'Post-extraction checkup.'],
    [10,5,'other',    16, '11:00 AM', 'Periodontal treatment.'],
    [11,6,'cleaning', 17, '09:00 AM', 'Whitening session 2.'],
    [12,7,'crown',    17, '10:00 AM', 'General family checkup.'],
    [13,0,'braces',   18, '09:30 AM', 'Wire adjustment visit.'],
    [14,1,'other',    18, '11:00 AM', 'Sensitivity treatment.'],
    [0,2,'crown',     19, '10:00 AM', 'Permanent crown placement.'],
    [1,3,'cleaning',  19, '09:00 AM', 'Fluoride treatment.'],
    [2,4,'braces',    20, '10:30 AM', 'Oral surgery follow-up.'],
    [3,5,'other',     21, '11:00 AM', 'Gum disease follow-up.'],
    [4,6,'cleaning',  21, '09:00 AM', 'Teeth polishing session.'],
  ];

  for (const [pIdx,dIdx,cond,off,slot,notes] of confirmedData) {
    await makeAppt(patUsers[pIdx].id, docRows[dIdx].id, cond, nextWeekday(off), slot, notes, 'confirmed', secretary.id);
  }

  // مواعيد منتهية - completed (20 موعد)
  const completedData = [
    [0,0,'cleaning',   5,  '09:00 AM', 'Routine cleaning done.'],
    [1,1,'extraction', 8,  '10:00 AM', 'Lower wisdom tooth extracted.'],
    [2,2,'crown',      10, '11:00 AM', 'Crown fitted successfully.'],
    [3,0,'braces',     12, '09:30 AM', 'Initial braces fitting.'],
    [4,1,'cleaning',   15, '08:30 AM', 'Deep cleaning session.'],
    [5,3,'other',      20, '02:00 PM', 'General checkup completed.'],
    [6,0,'braces',     25, '10:00 AM', 'Braces consultation done.'],
    [7,4,'extraction', 7,  '09:00 AM', 'Impacted tooth removed.'],
    [8,5,'other',      9,  '11:00 AM', 'Gum disease treated.'],
    [9,6,'cleaning',   11, '10:00 AM', 'Whitening completed.'],
    [10,7,'crown',     13, '09:30 AM', 'Full checkup done.'],
    [11,2,'crown',     16, '11:30 AM', 'Bridge installation.'],
    [12,3,'cleaning',  18, '10:00 AM', 'Kids fluoride treatment.'],
    [13,4,'braces',    22, '09:00 AM', 'Post-surgery review.'],
    [14,5,'other',     24, '11:00 AM', 'Periodontal scaling.'],
    [0,6,'cleaning',   26, '09:30 AM', 'Cosmetic polishing.'],
    [1,7,'other',      28, '10:00 AM', 'Annual checkup.'],
    [2,0,'rootcanal',  30, '11:00 AM', 'Root canal completed.'],
    [3,1,'extraction', 32, '09:00 AM', 'Tooth 27 extracted.'],
    [4,2,'crown',      35, '10:30 AM', 'Implant crown placed.'],
  ];

  for (const [pIdx,dIdx,cond,off,slot,notes] of completedData) {
    await makeAppt(patUsers[pIdx].id, docRows[dIdx].id, cond, pastWeekday(off), slot, notes, 'completed', secretary.id);
  }

  // مواعيد مرفوضة - rejected (5 مواعيد)
  const rejectedData = [
    [5,0,'other',     3, '03:00 PM', 'No specific concern.', 'Doctor fully booked that day.'],
    [6,1,'cleaning',  6, '01:00 PM', 'Regular cleaning.', 'Please rebook for next week.'],
    [7,2,'other',     4, '02:00 PM', 'General query.', 'Slot no longer available.'],
    [8,3,'braces',    2, '01:30 PM', 'Braces query.', 'Doctor on leave that day.'],
    [9,4,'crown',     5, '03:00 PM', 'Crown query.', 'Please choose another time slot.'],
  ];

  for (const [pIdx,dIdx,cond,off,slot,notes,reason] of rejectedData) {
    await makeAppt(patUsers[pIdx].id, docRows[dIdx].id, cond, pastWeekday(off), slot, notes, 'rejected', null, reason);
  }

  console.log(`   ✓ ${apptCount} appointments total`);
  console.log(`     - 20 pending`);
  console.log(`     - 15 confirmed`);
  console.log(`     - 20 completed`);
  console.log(`     - 5  rejected`);

  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  ✅  Seed complete! Full clinic data loaded.');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  👥  Staff accounts:');
  console.log('  Secretary  → secretary@dentacare.com  / Secretary@123');
  console.log('  Secretary  → lara@dentacare.com       / Secretary@123');
  console.log('');
  console.log('  🩺  Doctor accounts (all use Doctor@123):');
  console.log('  yousef@dentacare.com     → Orthodontics');
  console.log('  amira@dentacare.com      → Endodontics');
  console.log('  khalid@dentacare.com     → Prosthodontics');
  console.log('  lina@dentacare.com       → Pediatric Dentistry');
  console.log('  sami@dentacare.com       → Oral Surgery');
  console.log('  reem@dentacare.com       → Periodontics');
  console.log('  tariq.doc@dentacare.com  → Cosmetic Dentistry');
  console.log('  hana.doc@dentacare.com   → General Dentistry');
  console.log('');
  console.log('  🧑‍⚕️  Patient accounts (all use Patient@123):');
  console.log('  sara@example.com, ahmed@example.com, rania@example.com');
  console.log('  omar@example.com, fatima@example.com, tariq@example.com');
  console.log('  hana@example.com, malik@example.com, dina@example.com');
  console.log('  karim@example.com, layla@example.com, ziad@example.com');
  console.log('  nadia@example.com, bassam@example.com, iman@example.com');
  console.log('');

  await sequelize.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
