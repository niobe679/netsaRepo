const User = require('../models/User');

const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const newUser = new User({ name, email, password, role });
  await newUser.save();
  res.status(201).json({ message: "User created", user: newUser });
};

const updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ message: "User updated", user });
};

const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};