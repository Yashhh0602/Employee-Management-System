const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }
  next();
};

// Prevents Employees from editing restricted fields on their own profile
const restrictEmployeeFields = (req, res, next) => {
  if (req.user.role === 'employee') {
    const allowed = ['name', 'phone', 'profileImage', 'password'];
    Object.keys(req.body).forEach((key) => {
      if (!allowed.includes(key)) delete req.body[key];
    });
  }
  next();
};

module.exports = { authorize, restrictEmployeeFields };