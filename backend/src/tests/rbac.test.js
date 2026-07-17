require('./setup');
const request = require('supertest');
const app = require('../server');
const { Employee } = require('../models');

let adminToken, hrToken, empToken;
let empUserId;

describe('RBAC', () => {
  beforeAll(async () => {
    const admin = await Employee.create({
      employeeId: 'EMP001', name: 'Admin', email: 'admin2@test.com', password: 'Pass@123',
      phone: '1111111111', department: 'Management', designation: 'Super Admin',
      salary: 100000, joiningDate: '2024-01-01', status: 'active', role: 'super_admin',
    });
    const hr = await Employee.create({
      employeeId: 'EMP002', name: 'HR', email: 'hr2@test.com', password: 'Pass@123',
      phone: '2222222222', department: 'HR', designation: 'HR Manager',
      salary: 60000, joiningDate: '2024-01-01', status: 'active', role: 'hr_manager',
    });
    const emp = await Employee.create({
      employeeId: 'EMP003', name: 'Employee', email: 'emp2@test.com', password: 'Pass@123',
      phone: '3333333333', department: 'Engineering', designation: 'Dev',
      salary: 40000, joiningDate: '2024-01-01', status: 'active', role: 'employee',
    });
    empUserId = emp.id;

    const loginAs = async (email) => {
      const res = await request(app).post('/api/auth/login').send({ email, password: 'Pass@123' });
      return res.body.token;
    };
    adminToken = await loginAs('admin2@test.com');
    hrToken = await loginAs('hr2@test.com');
    empToken = await loginAs('emp2@test.com');
  });

  test('employee cannot list all employees', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('HR cannot delete an employee', async () => {
    const res = await request(app)
      .delete(`/api/employees/${empUserId}`)
      .set('Authorization', `Bearer ${hrToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Super Admin can delete an employee', async () => {
    const res = await request(app)
      .delete(`/api/employees/${empUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('HR cannot promote someone to super_admin', async () => {
    const target = await Employee.create({
      employeeId: 'EMP004', name: 'Target', email: 'target@test.com', password: 'Pass@123',
      phone: '4444444444', department: 'Engineering', designation: 'Dev',
      salary: 40000, joiningDate: '2024-01-01', status: 'active', role: 'employee',
    });
    const res = await request(app)
      .put(`/api/employees/${target.id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ role: 'super_admin' });
    expect(res.statusCode).toBe(403);
  });

  test('employee editing own profile cannot change salary', async () => {
    const emp = await Employee.create({
      employeeId: 'EMP005', name: 'SelfEdit', email: 'selfedit@test.com', password: 'Pass@123',
      phone: '5555555555', department: 'Engineering', designation: 'Dev',
      salary: 40000, joiningDate: '2024-01-01', status: 'active', role: 'employee',
    });
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'selfedit@test.com', password: 'Pass@123' });
    const token = loginRes.body.token;

    await request(app)
      .put(`/api/employees/${emp.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ salary: 999999 });

    const check = await Employee.findByPk(emp.id);
    expect(parseFloat(check.salary)).toBe(40000); // unchanged
  });
});