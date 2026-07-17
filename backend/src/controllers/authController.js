const jwt = require('jsonwebtoken');
const { Employee } = require('../models');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Employee.findOne({ where: { email, isDeleted: false } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  // stateless JWT — client just discards token; blacklist here if needed
  res.json({ message: 'Logged out' });
};