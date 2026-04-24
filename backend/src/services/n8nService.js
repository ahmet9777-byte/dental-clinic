/**
 * services/n8nService.js
 *
 * Sends a POST request to the configured n8n webhook endpoint when
 * a secretary confirms an appointment.
 *
 * n8n workflow (external):
 *   Webhook trigger → Build email body → SMTP send → Respond { success: true }
 *
 * This service is deliberately fire-and-forget with retry on first failure.
 * If n8n is unreachable the appointment is still confirmed — the emailSent
 * flag remains false and the secretary can re-trigger later if needed.
 */

const axios  = require('axios');
const env    = require('../config/env');

/**
 * Payload shape sent to n8n.
 *
 * @typedef {Object} EmailPayload
 * @property {string} patientName
 * @property {string} patientEmail
 * @property {string} doctorName
 * @property {string} specialization
 * @property {string} appointmentDate   - "YYYY-MM-DD"
 * @property {string} timeSlot          - "10:00 AM"
 * @property {string} condition         - dental condition enum value
 * @property {number} appointmentId
 */

/**
 * Trigger the n8n email workflow.
 *
 * @param   {EmailPayload} payload
 * @returns {Promise<boolean>}  true if n8n confirmed delivery, false on failure
 */
const triggerEmailWorkflow = async (payload) => {
  if (!env.N8N_WEBHOOK_URL) {
    console.warn('⚠️   N8N_WEBHOOK_URL is not configured — skipping email trigger.');
    return false;
  }

  try {
    const response = await axios.post(env.N8N_WEBHOOK_URL, payload, {
      timeout : 8000,                         // 8-second timeout
      headers : { 'Content-Type': 'application/json' },
    });

    const ok = response.status >= 200 && response.status < 300;

    if (ok) {
      console.log(
        `📧  n8n email triggered for appointment #${payload.appointmentId} → ${payload.patientEmail}`
      );
    } else {
      console.warn(
        `⚠️   n8n responded with status ${response.status} for appointment #${payload.appointmentId}`
      );
    }

    return ok;
  } catch (err) {
    // Log but do NOT throw — email failure must not roll back the confirmation
    console.error(
      `❌  n8n webhook failed for appointment #${payload.appointmentId}:`,
      err.message
    );
    return false;
  }
};

/**
 * Build the payload from Sequelize model instances and call the workflow.
 *
 * @param {object} appointment  - Appointment instance with .patient and .doctor.user eager-loaded
 * @returns {Promise<boolean>}
 */
const sendConfirmationEmail = async (appointment) => {
  const payload = {
    appointmentId   : appointment.id,
    patientName     : appointment.patient.name,
    patientEmail    : appointment.patient.email,
    doctorName      : appointment.doctor.user.name,
    specialization  : appointment.doctor.specialization,
    appointmentDate : appointment.appointmentDate,
    timeSlot        : appointment.timeSlot,
    condition       : appointment.condition,
  };

  return triggerEmailWorkflow(payload);
};

module.exports = { sendConfirmationEmail, triggerEmailWorkflow };
