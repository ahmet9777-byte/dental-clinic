/**
 * routes/index.js
 *
 * Single entry point that mounts every route group under /api.
 * app.js imports only this file.
 */

const router = require('express').Router();

const { doctorSelfRouter } = require('./doctors');

router.use('/auth',         require('./auth'));
router.use('/doctors',      require('./doctors'));
router.use('/appointments', require('./appointments'));
router.use('/doctor',       doctorSelfRouter);   // /api/doctor/schedule, /api/doctor/patients

// Health-check — useful for load balancers / uptime monitors
router.get('/health', (req, res) => {
  res.json({
    success : true,
    status  : 'ok',
    uptime  : process.uptime().toFixed(2) + 's',
    ts      : new Date().toISOString(),
  });
});

module.exports = router;
