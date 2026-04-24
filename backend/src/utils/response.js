/**
 * utils/response.js
 *
 * Uniform JSON response shapes across all controllers.
 *
 *  success(res, data, message, statusCode)
 *  paginated(res, rows, count, page, limit)
 */

/**
 * Send a successful JSON response.
 *
 * @param {object}  res        - Express response object
 * @param {*}       data       - payload (object, array, or null)
 * @param {string}  [message]  - human-readable message
 * @param {number}  [status]   - HTTP status code (default 200)
 */
const success = (res, data = null, message = 'Success', status = 200) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(status).json(body);
};

/**
 * Send a paginated list response.
 *
 * @param {object}   res
 * @param {Array}    rows   - items for the current page
 * @param {number}   count  - total rows across all pages
 * @param {number}   page   - current page number (1-based)
 * @param {number}   limit  - items per page
 */
const paginated = (res, rows, count, page, limit) => {
  return res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      total      : count,
      page       : Number(page),
      limit      : Number(limit),
      totalPages : Math.ceil(count / limit),
    },
  });
};

module.exports = { success, paginated };
