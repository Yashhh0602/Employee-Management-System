const { body } = require('express-validator');

exports.employeeRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('department').notEmpty().withMessage('Department required'),
];

exports.employeeUpdateRules = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty'),
];