require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const organizationRoutes = require('./routes/organizationRoutes');

const app = express();
app.use(helmet());
app.use(cors({
  origin: 'https://employee-management-system-silk-omega.vercel.app',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/organization', organizationRoutes);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  sequelize.sync({ alter: true }).then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }).catch((err) => console.error('Failed to start server:', err));
}

module.exports = app;