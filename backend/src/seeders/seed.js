require('dotenv').config();
const { sequelize, Employee } = require('../models');

const seed = async () => {
  try {
    await sequelize.sync({ force: true }); // WARNING: drops and recreates tables — fine for dev/first seed

    const admin = await Employee.create({
      employeeId: 'EMP001',
      name: 'Super Admin',
      email: 'admin@ems.com',
      password: 'Admin@123',
      phone: '9999999999',
      department: 'Management',
      designation: 'Super Admin',
      salary: 100000,
      joiningDate: '2024-01-01',
      status: 'active',
      role: 'super_admin',
    });

    const hr = await Employee.create({
      employeeId: 'EMP002',
      name: 'HR Manager',
      email: 'hr@ems.com',
      password: 'Hr@12345',
      phone: '8888888888',
      department: 'HR',
      designation: 'HR Manager',
      salary: 60000,
      joiningDate: '2024-02-01',
      status: 'active',
      role: 'hr_manager',
      reportingManagerId: admin.id,
    });

    await Employee.create({
      employeeId: 'EMP003',
      name: 'John Employee',
      email: 'employee@ems.com',
      password: 'Emp@12345',
      phone: '7777777777',
      department: 'Engineering',
      designation: 'Software Engineer',
      salary: 40000,
      joiningDate: '2024-03-01',
      status: 'active',
      role: 'employee',
      reportingManagerId: hr.id,
    });

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();