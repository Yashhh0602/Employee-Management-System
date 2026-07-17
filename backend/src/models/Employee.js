const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: { type: DataTypes.STRING, allowNull: false },
  phone: {
    type: DataTypes.STRING,
    validate: { is: /^[0-9]{10}$/ },
  },
  department: DataTypes.STRING,
  designation: DataTypes.STRING,
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    validate: { min: 0 },
  },
  joiningDate: DataTypes.DATEONLY,
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'hr_manager', 'employee'),
    defaultValue: 'employee',
  },
  reportingManagerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  profileImage: DataTypes.STRING,
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (emp) => {
      emp.password = await bcrypt.hash(emp.password, 10);
    },
    beforeUpdate: async (emp) => {
      if (emp.changed('password')) {
        emp.password = await bcrypt.hash(emp.password, 10);
      }
    },
  },
});

Employee.belongsTo(Employee, { as: 'manager', foreignKey: 'reportingManagerId' });
Employee.hasMany(Employee, { as: 'reportees', foreignKey: 'reportingManagerId' });

Employee.prototype.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = Employee;