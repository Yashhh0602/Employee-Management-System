const { Employee, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  const { search, department, role, status, sortBy = 'joiningDate', order = 'DESC', page = 1, limit = 10 } = req.query;
  const where = { isDeleted: false };

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (department) where.department = department;
  if (role) where.role = role;
  if (status) where.status = status;

  const offset = (page - 1) * limit;
  const { rows, count } = await Employee.findAndCountAll({
    where,
    order: [[sortBy, order]],
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: { exclude: ['password'] },
  });

  res.json({ total: count, page: parseInt(page), totalPages: Math.ceil(count / limit), data: rows });
};

exports.getOne = async (req, res) => {
  const emp = await Employee.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
  if (!emp || emp.isDeleted) return res.status(404).json({ message: 'Not found' });
  res.json(emp);
};

exports.create = async (req, res) => {
  try {
    const emp = await Employee.create(req.body);
    const { password, ...safe } = emp.toJSON();
    res.status(201).json(safe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp || emp.isDeleted) return res.status(404).json({ message: 'Not found' });

    // HR cannot promote to super_admin
    if (req.user.role === 'hr_manager' && req.body.role === 'super_admin') {
      return res.status(403).json({ message: 'HR cannot assign Super Admin role' });
    }
    await emp.update(req.body);
    const { password, ...safe } = emp.toJSON();
    res.json(safe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  // soft delete only
  const emp = await Employee.findByPk(req.params.id);
  if (!emp) return res.status(404).json({ message: 'Not found' });
  emp.isDeleted = true;
  await emp.save();
  res.json({ message: 'Employee soft-deleted' });
};

exports.getReportees = async (req, res) => {
  const reportees = await Employee.findAll({
    where: { reportingManagerId: req.params.id, isDeleted: false },
    attributes: { exclude: ['password'] },
  });
  res.json(reportees);
};

exports.updateManager = async (req, res) => {
  const { managerId } = req.body;
  const empId = req.params.id;

  if (managerId === empId) {
    return res.status(400).json({ message: 'Employee cannot be their own manager' });
  }

  // circular reporting check: walk up the new manager's chain
  let current = await Employee.findByPk(managerId);
  while (current) {
    if (current.id === empId) {
      return res.status(400).json({ message: 'Circular reporting detected' });
    }
    current = current.reportingManagerId ? await Employee.findByPk(current.reportingManagerId) : null;
  }

  const emp = await Employee.findByPk(empId);
  emp.reportingManagerId = managerId;
  await emp.save();
  res.json({ message: 'Manager updated' });
};

exports.getDashboardStats = async (req, res) => {
  const total = await Employee.count({ where: { isDeleted: false } });
  const active = await Employee.count({ where: { isDeleted: false, status: 'active' } });
  const inactive = await Employee.count({ where: { isDeleted: false, status: 'inactive' } });

  const deptCounts = await Employee.findAll({
    where: { isDeleted: false },
    attributes: ['department', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['department'],
  });

  const departmentBreakdown = deptCounts.map((d) => ({
    department: d.department,
    count: parseInt(d.get('count')),
  }));

  res.json({
    total,
    active,
    inactive,
    departmentCount: departmentBreakdown.length,
    departmentBreakdown,
  });
};

const fs = require('fs');
const csv = require('csv-parser');

exports.importCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const results = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      let created = 0;
      for (const row of results) {
        try {
          await Employee.create({
            employeeId: row.employeeId,
            name: row.name,
            email: row.email,
            password: row.password || 'Default@123',
            phone: row.phone,
            department: row.department,
            designation: row.designation,
            salary: parseFloat(row.salary),
            joiningDate: row.joiningDate,
            status: row.status || 'active',
            role: row.role || 'employee',
          });
          created++;
        } catch (err) {
          errors.push({ row: row.employeeId || row.email, error: err.message });
        }
      }
      fs.unlinkSync(req.file.path); // clean up uploaded file
      res.json({ message: `Imported ${created} of ${results.length} rows`, created, errors });
    });
};