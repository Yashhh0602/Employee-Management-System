require('dotenv').config();
const { sequelize } = require('./models');
require('./queues/salaryNotification.worker');

sequelize.authenticate()
  .then(() => console.log('Worker connected to DB'))
  .catch((err) => console.error('Worker DB connection failed:', err));

console.log('Salary notification worker started');