// toto-app/routes/externalApiRoutes.js
// مسیرهای مربوط به همگام‌سازی با API خارجی

const express = require('express');
const { protect, authorize, admin } = require('../middleware/authMiddleware');
const { syncGames, syncResults } = require('../controllers/externalApiController');

const router = express.Router();

router.route('/sync-games').post(protect, authorize('admin'), syncGames);
router.route('/sync-results').post(protect, authorize('admin'), syncResults);

module.exports = router;