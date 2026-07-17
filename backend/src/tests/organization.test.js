require('./setup');
const request = require('supertest');
const app = require('../server');
const { Employee } = require('../models');

describe('Organization hierarchy', () => {
  let adminToken, mgr, sub;

  beforeAll(async () => {
    const admin = await Employee.create({
      employeeId: 'EMP001', name: 'Admin', email: 'orgadmin@test.com', password: 'Pass@123',
      phone: '1111111111', department: 'Management', designation: 'Super Admin',
      salary: 100000, joiningDate: '2024-01-01', status: 'active', role: 'super_admin',
    });
    mgr = await Employee.create({
      employeeId: 'EMP002', name: 'Manager', email: 'mgr@test.com', password: 'Pass@123',
      phone: '2222222222', department: 'Eng', designation: 'Lead',
      salary: 70000, joiningDate: '2024-01-01', status: 'active', role: 'hr_manager',
      reportingManagerId: admin.id,
    });
    sub = await Employee.create({
      employeeId: 'EMP003', name: 'Sub', email: 'sub@test.com', password: 'Pass@123',
      phone: '3333333333', department: 'Eng', designation: 'Dev',
      salary: 40000, joiningDate: '2024-01-01', status: 'active', role: 'employee',
      reportingManagerId: mgr.id,
    });

    const res = await request(app).post('/api/auth/login').send({ email: 'orgadmin@test.com', password: 'Pass@123' });
    adminToken = res.body.token;
  });

  test('blocks circular reporting', async () => {
    const res = await request(app)
      .patch(`/api/employees/${mgr.id}/manager`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ managerId: sub.id }); // sub reports to mgr already -> this would create a cycle
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/circular/i);
  });

  test('returns direct reportees correctly', async () => {
    const res = await request(app)
      .get(`/api/employees/${mgr.id}/reportees`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(sub.id);
  });

  test('org tree returns nested structure', async () => {
    const res = await request(app)
      .get('/api/organization/tree')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body[0].children[0].children[0].name).toBe('Sub');
  });
});