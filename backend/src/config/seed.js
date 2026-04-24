/**
 * seed.js  — نسخة مُصلحة
 * يستخدم SQL مباشر بدلاً من Sequelize sync
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
  }
);

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

  console.log('🌱  Inserting users...');
  const pwSec = await bcrypt.hash('Secretary@123', SALT_ROUNDS);
  const pwPat = await bcrypt.hash('Patient@123',   SALT_ROUNDS);
  const pwDoc = await bcrypt.hash('Doctor@123',    SALT_ROUNDS);

  await sequelize.query(
    `INSERT INTO users (name, email, password, role, phone, is_active, created_at, updated_at) VALUES
      ('Nour Al-Admin',     'secretary@dentacare.com', $1, 'secretary', '+970591000001', true, NOW(), NOW()),
      ('Sara Khalil',       'sara@example.com',        $2, 'patient',   '+970591000002', true, NOW(), NOW()),
      ('Dr. Yousef Haddad', 'yousef@dentacare.com',    $3, 'doctor',    '+970591000003', true, NOW(), NOW()),
      ('Dr. Amira Nasser',  'amira@dentacare.com',     $3, 'doctor',    '+970591000004', true, NOW(), NOW())`,
    { bind: [pwSec, pwPat, pwDoc] }
  );

  const users = await sequelize.query('SELECT id, name, role FROM users ORDER BY id', { type: sequelize.QueryTypes.SELECT });
  const patient  = users.find(u => u.role === 'patient');
  const drYousef = users.find(u => u.name === 'Dr. Yousef Haddad');
  const drAmira  = users.find(u => u.name === 'Dr. Amira Nasser');
  console.log('   ✓ Users:', users.map(u => u.name).join(', '));

  console.log('🌱  Inserting doctor profiles...');
  await sequelize.query(
    `INSERT INTO doctors (user_id, specialization, bio, years_experience, is_available, created_at, updated_at) VALUES
      ($1, 'Orthodontics', 'Specialist in braces and dental alignment.', 12, true, NOW(), NOW()),
      ($2, 'Endodontics',  'Expert in root canals and tooth preservation.', 8, true, NOW(), NOW())`,
    { bind: [drYousef.id, drAmira.id] }
  );

  const doctors  = await sequelize.query('SELECT id, user_id FROM doctors ORDER BY id', { type: sequelize.QueryTypes.SELECT });
  const docY = doctors.find(d => d.user_id === drYousef.id);
  const docA = doctors.find(d => d.user_id === drAmira.id);
  console.log('   ✓ Doctor profiles created');

  console.log('🌱  Inserting availability (Mon-Fri 9AM-5PM)...');
  const availVals = [];
  const availBind = [];
  let bi = 1;
  for (const docId of [docY.id, docA.id]) {
    for (const day of [1,2,3,4,5]) {
      availVals.push(`($${bi}, ${day}, '09:00:00', '17:00:00', 30, NOW())`);
      availBind.push(docId);
      bi++;
    }
  }
  await sequelize.query(
    `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration, created_at) VALUES ${availVals.join(',')}`,
    { bind: availBind }
  );
  console.log('   ✓ Availability set');

  console.log('🌱  Inserting sample appointments...');
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  if (tom.getDay() === 0) tom.setDate(tom.getDate() + 1);
  if (tom.getDay() === 6) tom.setDate(tom.getDate() + 2);
  const tomStr = tom.toISOString().split('T')[0];

  const day2 = new Date(tom);
  day2.setDate(day2.getDate() + 1);
  if (day2.getDay() === 6) day2.setDate(day2.getDate() + 2);
  const day2Str = day2.toISOString().split('T')[0];

  await sequelize.query(
    `INSERT INTO appointments (patient_id, doctor_id, condition, appointment_date, time_slot, notes, status, email_sent, created_at, updated_at) VALUES
      ($1, $2, 'braces',   $4, '10:00 AM', 'First consultation for braces.',      'pending',   false, NOW(), NOW()),
      ($1, $3, 'cleaning', $5, '11:00 AM', 'Regular teeth cleaning appointment.', 'confirmed', true,  NOW(), NOW()),
      ($1, $2, 'crown',    $5, '02:00 PM', 'Crown replacement on lower left.',    'rejected',  false, NOW(), NOW())`,
    { bind: [patient.id, docY.id, docA.id, tomStr, day2Str] }
  );
  console.log('   ✓ Sample appointments: pending + confirmed + rejected');

  console.log('');
  console.log('══════════════════════════════════════════');
  console.log('  ✅  Seed complete!');
  console.log('══════════════════════════════════════════');
  console.log('');
  console.log('  Patient   → sara@example.com          / Patient@123   → /login');
  console.log('  Secretary → secretary@dentacare.com   / Secretary@123 → /staff-login');
  console.log('  Doctor    → yousef@dentacare.com      / Doctor@123    → /staff-login');
  console.log('');

  await sequelize.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
