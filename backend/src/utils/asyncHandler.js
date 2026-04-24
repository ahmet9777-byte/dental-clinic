/**
 * utils/asyncHandler.js
 *
 * Wraps an async controller function and forwards any rejection
 * to Express's next(err), eliminating repetitive try/catch blocks.
 *
 * Usage:
 *   router.get('/resource', asyncHandler(async (req, res) => {
 *     const data = await someService();
 *     success(res, data);
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
