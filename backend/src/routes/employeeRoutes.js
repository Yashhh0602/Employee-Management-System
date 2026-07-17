const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { authorize, restrictEmployeeFields } = require('../middleware/rbac');
const { employeeRules, employeeUpdateRules } = require('../validators/employeeValidator');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/employeeController');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', authorize('super_admin', 'hr_manager'), ctrl.getAll);
router.get('/dashboard', authorize('super_admin', 'hr_manager'), ctrl.getDashboardStats);
router.get('/:id', ctrl.getOne);
router.get('/:id/reportees', ctrl.getReportees);

router.post('/', authorize('super_admin', 'hr_manager'), employeeRules, validate, ctrl.create);

router.put('/:id', restrictEmployeeFields, employeeUpdateRules, validate, ctrl.update);
router.patch('/:id/manager', authorize('super_admin'), ctrl.updateManager);

router.delete('/:id', authorize('super_admin'), ctrl.remove);
router.post('/import', authorize('super_admin', 'hr_manager'), upload.single('file'), ctrl.importCSV);

module.exports = router;