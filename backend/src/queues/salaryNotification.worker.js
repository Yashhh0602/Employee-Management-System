const { Worker } = require('bullmq');
const connection = require('./redisConnection');

const worker = new Worker(
  'salary-notifications',
  async (job) => {
    const { employeeId, oldSalary, newSalary, changedBy } = job.data;
    console.log(`[salary-notify] Employee ${employeeId}: ${oldSalary} -> ${newSalary} (changed by ${changedBy})`);
    // Placeholder for real notification logic (email, Slack webhook, etc.)
  },
  { connection }
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err.message));

module.exports = worker;