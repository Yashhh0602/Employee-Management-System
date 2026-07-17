const { Employee } = require('../models');

const buildTree = async (managerId = null) => {
  const nodes = await Employee.findAll({
    where: { reportingManagerId: managerId, isDeleted: false },
    attributes: { exclude: ['password'] },
  });
  const tree = [];
  for (const node of nodes) {
    const children = await buildTree(node.id);
    tree.push({ ...node.toJSON(), children });
  }
  return tree;
};

exports.getTree = async (req, res) => {
  const tree = await buildTree(null); // top-level = Super Admin(s)
  res.json(tree);
};