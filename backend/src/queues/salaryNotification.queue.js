const { Queue } = require('bullmq');
const connection = require('./redisConnection');

const salaryNotificationQueue = new Queue('salary-notifications', { connection });

module.exports = salaryNotificationQueue;