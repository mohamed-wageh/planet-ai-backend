const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt.util');
const { sendOTPEmail } = require('../services/email.service');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  const { username, email, password, governorate } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const user = await User.create({ username, email, password, governorate });

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

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

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

// @desc    Send OTP to email for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select(
    '+resetPasswordOTP +resetPasswordOTPExpiry'
  );

  // رسالة عامة عشان مندلش على وجود الإيميل من عدمه
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If this email exists, an OTP has been sent.',
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 دقايق
  await user.save({ validateBeforeSave: false });

  await sendOTPEmail(email, otp);

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email.',
  });
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select(
    '+password +resetPasswordOTP +resetPasswordOTPExpiry'
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }

  if (user.resetPasswordOTPExpiry < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'OTP has expired. Please request a new one.',
    });
  }

  // الـ pre('save') hook هيعمل الـ hash تلقائي زي signup
  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpiry = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully.',
  });
};

module.exports = {
  signup,
  signin,
  getMe,
  forgotPassword,
  resetPassword,
};