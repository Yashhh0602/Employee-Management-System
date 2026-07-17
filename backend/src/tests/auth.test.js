require('./setup');
const request = require('supertest');
const app = require('../server');
const { Employee } = require('../models');

describe('Auth', () => {
  beforeAll(async () => {
    await Employee.create({
      employeeId: 'EMP001',
      name: 'Super Admin',
      email: 'admin@test.com',
      password: 'Admin@123',
      phone: '9999999999',
      department: 'Management',
      designation: 'Super Admin',
      salary: 100000,
      joiningDate: '2024-01-01',
      status: 'active',
      role: 'super_admin',
    });
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('super_admin');
  });

  test('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'whatever' });
    expect(res.statusCode).toBe(401);
  });

  test('blocks access to protected route without token', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.statusCode).toBe(401);
  });
});