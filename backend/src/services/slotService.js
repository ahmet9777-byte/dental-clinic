/**
 * services/slotService.js
 *
 * Calculates available booking slots for a doctor on a requested date.
 *
 * Logic:
 *   1. Look up the doctor's DoctorAvailability row for that day-of-week.
 *   2. Generate every slot between startTime and endTime at slotDuration intervals.
 *   3. Fetch all confirmed/pending appointments for that doctor on that date.
 *   4. Subtract booked slots → return what is still open.
 */

const { Op }                        = require('sequelize');
const { DoctorAvailability, Appointment } = require('../models');

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Parse a TIME string "HH:MM:SS" or "HH:MM" into total minutes since midnight.
 */
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Format total minutes since midnight to "HH:MM AM/PM" display string.
 */
const minutesToDisplay = (totalMinutes) => {
  const h24  = Math.floor(totalMinutes / 60);
  const min  = totalMinutes % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12  = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
};

/**
 * Generate every slot label between start and end (exclusive of end).
 *
 * @param {number} startMins  - start of day in minutes (e.g. 540 = 09:00)
 * @param {number} endMins    - end of day in minutes   (e.g. 1020 = 17:00)
 * @param {number} duration   - slot duration in minutes (e.g. 30)
 * @returns {string[]}        - e.g. ['9:00 AM', '9:30 AM', ...]
 */
const generateSlots = (startMins, endMins, duration) => {
  const slots = [];
  for (let t = startMins; t + duration <= endMins; t += duration) {
    slots.push(minutesToDisplay(t));
  }
  return slots;
};

// ─── Main export ──────────────────────────────────────────────────────────

/**
 * Returns available (un-booked) time slots for a doctor on a given date.
 *
 * @param {number} doctorId
 * @param {string} dateStr   - ISO date string "YYYY-MM-DD"
 * @returns {Promise<{
 *   date         : string,
 *   dayName      : string,
 *   allSlots     : string[],
 *   bookedSlots  : string[],
 *   freeSlots    : string[],
 *   isWorkingDay : boolean
 * }>}
 */
const getAvailableSlots = async (doctorId, dateStr) => {
  const date       = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek  = date.getUTCDay();   // 0 = Sun … 6 = Sat
  const DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // ── 1. Fetch availability row for this day-of-week ───────────────────────
  const avail = await DoctorAvailability.findOne({
    where: { doctorId, dayOfWeek },
  });

  if (!avail) {
    return {
      date,
      dayName      : DAY_NAMES[dayOfWeek],
      allSlots     : [],
      bookedSlots  : [],
      freeSlots    : [],
      isWorkingDay : false,
    };
  }

  // ── 2. Generate all theoretical slots ────────────────────────────────────
  const startMins = timeToMinutes(avail.startTime);
  const endMins   = timeToMinutes(avail.endTime);
  const allSlots  = generateSlots(startMins, endMins, avail.slotDuration);

  // ── 3. Fetch booked slots for that doctor on that exact date ─────────────
  const existing = await Appointment.findAll({
    where: {
      doctorId,
      appointmentDate : dateStr,
      status          : { [Op.in]: ['pending', 'confirmed'] },
    },
    attributes: ['timeSlot'],
  });

  const bookedSlots = existing.map((a) => a.timeSlot);

  // ── 4. Subtract booked from all ───────────────────────────────────────────
  const bookedSet = new Set(bookedSlots);
  const freeSlots = allSlots.filter((s) => !bookedSet.has(s));

  return {
    date         : dateStr,
    dayName      : DAY_NAMES[dayOfWeek],
    allSlots,
    bookedSlots,
    freeSlots,
    isWorkingDay : true,
  };
};

/**
 * Returns available slots across a range of dates (used by the booking calendar).
 *
 * @param {number}   doctorId
 * @param {string}   fromDate   - "YYYY-MM-DD"
 * @param {number}   [days=14]  - how many days ahead to check
 * @returns {Promise<Array>}
 */
const getAvailableSlotsRange = async (doctorId, fromDate, days = 14) => {
  const results = [];
  const start   = new Date(fromDate + 'T00:00:00Z');

  for (let i = 0; i < days; i++) {
    const d    = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const iso  = d.toISOString().split('T')[0];
    const info = await getAvailableSlots(doctorId, iso);
    results.push(info);
  }

  return results;
};

module.exports = { getAvailableSlots, getAvailableSlotsRange };
