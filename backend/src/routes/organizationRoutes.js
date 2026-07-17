const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getTree } = require('../controllers/organizationController');

router.get('/tree', protect, getTree);

module.exports = router;