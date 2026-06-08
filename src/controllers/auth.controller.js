const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.util');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  const { username, email, password, governorate } = req.body;
  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
    governorate,
  });

  if (user) {
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        governorate: user.governorate,
        token,
      },
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid user data' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/signin
// @access  Public
const signin = async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  // We need to select the password field explicitly because select: false is specified in the model
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'User logged in successfully',
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      governorate: user.governorate,
      token,
    },
  });
};
// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  // بنجيب أحدث بيانات لليوزر من الداتا بيز
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      governorate: user.governorate,
      createdAt: user.createdAt,
    },
  });
};


module.exports = {
  signup,
  signin,
  getMe,
};
