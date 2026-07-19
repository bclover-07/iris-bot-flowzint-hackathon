import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { sendOTPEmail } from '../config/mailer.js';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

function setTokenCookie(res, token) {
  res.cookie('iris_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const exists = await User.findOne({ email });
    if (exists) {
      if (!exists.isVerified) {
        await User.deleteOne({ email });
      } else {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry
    });

    try {
      console.log(`\n\n🎯 HACKATHON DEV MODE: Registration OTP for ${email} is ${otp}\n\n`);
      await sendOTPEmail(email, name, otp);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr.message);
    }

    return res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      userId: user._id,
      otpHint: `Verification code generated: ${otp} (Also sent to ${email})`
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOTP(req, res, next) {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (user.otpExpiry && new Date() > user.otpExpiry) return res.status(400).json({ error: 'OTP expired. Request a new one.' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = createToken(user._id);
    setTokenCookie(res, token);

    return res.json({
      message: 'Email verified successfully',
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function resendOTP(req, res, next) {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: 'Invalid request' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      console.log(`\n\n🎯 Resent OTP for ${user.email} is ${otp}\n\n`);
      await sendOTPEmail(user.email, user.name, otp);
    } catch (emailErr) {
      console.error('[Nodemailer] Email sending failed:', emailErr.message);
    }

    return res.json({ message: 'OTP resent successfully' });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      try {
        console.log(`\n\n🎯 Verification OTP for ${email} is ${otp}\n\n`);
        await sendOTPEmail(email, user.name, otp);
      } catch (emailErr) {
        console.error('[Nodemailer] Email sending failed:', emailErr.message);
      }
      return res.status(403).json({ error: 'Please verify your email first. A verification OTP has been sent.', userId: user._id });
    }

    const token = createToken(user._id);
    setTokenCookie(res, token);

    return res.json({ 
      user: { id: user._id, name: user.name, email: user.email },
      token
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie('iris_token');
  return res.json({ message: 'Logged out successfully' });
}

export async function getMe(req, res) {
  return res.json({ user: req.user });
}

export async function sendLoginOTP(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      console.log(`\n\n🎯 HACKATHON DEV MODE: Login OTP for ${email} is ${otp}\n\n`);
      await sendOTPEmail(email, user.name, otp);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr.message);
    }

    return res.json({ 
      message: 'Login OTP sent successfully', 
      userId: user._id,
      otpHint: `OTP code generated: ${otp} (Also sent to ${email})`
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyLoginOTP(req, res, next) {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ error: 'OTP expired. Request a new one.' });

    user.otp = undefined;
    user.otpExpiry = undefined;
    // Auto verify if they weren't verified yet
    if (!user.isVerified) {
      user.isVerified = true;
    }
    await user.save();

    const token = createToken(user._id);
    setTokenCookie(res, token);

    return res.json({
      message: 'Logged in successfully',
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
}
