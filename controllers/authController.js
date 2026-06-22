import { asyncHandler } from "../middleware/errorHandler.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "../services/email.js";
import { clearTokenCookies, generateAccessToken, generateRefreshToken, setTokenCookies } from "../utils/tokens.js";


const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already registered" });

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const user = await User.create({
    name,
    email,
    passwordHash: password,
    role: role || "jobseeker",
    otp,
    otpExpiry,
  });

  await sendOTPEmail(email, otp);

  res.status(201).json({
    message: "Registered! Check your email for OTP.",
    userId: user._id,
  });
});


// POST /api/v1/auth/verify-otp
export const verifyOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId).select("+otp +otpExpiry");
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.otp !== otp || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  res.json({ message: "Email verified!", user });
});

// POST /api/v1/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

  if (!user.isVerified) {
    return res.status(403).json({
      message: "Please verify your email first",
      userId: user._id,
    });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  res.json({ user });
});

// POST /api/v1/auth/refresh
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  const user = await User.findOne({ refreshToken: token });
  if (!user) return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(token, process.env.REFRESH_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Refresh token expired" });

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);
    res.json({ message: "Tokens refreshed" });
  });
});

// POST /api/v1/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null });
  }
  clearTokenCookies(res);
  res.json({ message: "Logged out successfully" });
});

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) return res.json({ message: "If that email exists, a reset link was sent" });

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendResetPasswordEmail(email, resetUrl);

  res.json({ message: "If that email exists, a reset link was sent" });
});

// POST /api/v1/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: new Date() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

  user.passwordHash = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  res.json({ message: "Password reset successful. Please login." });
});

// GET /api/v1/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});