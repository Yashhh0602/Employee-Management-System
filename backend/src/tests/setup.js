process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

const sequelize = require('../config/db.testconfig');

// Override the models to use the test DB connection
jest.mock('../config/db', () => require('../config/db.testconfig'));

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});