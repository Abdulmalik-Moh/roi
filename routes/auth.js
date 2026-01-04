const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'scentsbyroi@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-email-password'
    }
});

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user._id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
        { expiresIn: '30d' }
    );
};

// Test route
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Auth routes are working!',
        timestamp: new Date().toISOString()
    });
});

// GET /api/auth/me - Get current user profile
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// POST /api/auth/register - User registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        console.log('🔄 Registration attempt:', { name, email });
        
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        
        // Create user
        const user = await User.create({
            name,
            email,
            password
        });
        
        // Generate token
        const token = generateToken(user);
        
        console.log('✅ User registered successfully:', user.email);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            },
            token: token
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login attempt:', { email });
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            console.log('❌ No user found with email:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            console.log('❌ Password does not match for user:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate token
        const token = generateToken(user);
        
        console.log('✅ Login successful for user:', user.email);
        
        res.json({
            success: true,
            message: 'Login successful!',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                role: user.role || 'user'
            },
            token: token
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update allowed fields
        const { name, shippingAddress, preferences } = req.body;
        
        if (name) user.name = name;
        if (shippingAddress) user.shippingAddress = shippingAddress;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                shippingAddress: user.shippingAddress,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        console.log('🔐 Forgot password request for:', email);
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            // For security, don't reveal if user doesn't exist
            console.log('ℹ️ Password reset requested for non-existent email:', email);
            return res.json({ 
                success: true, 
                message: 'If an account exists with this email, password reset instructions will be sent.' 
            });
        }

        // Generate secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash token for database storage (security)
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Save to user (1 hour expiry)
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        
        // Send email
        const mailOptions = {
            from: '"Roi Beauty Essence" <scentsbyroi@gmail.com>',
            to: user.email,
            subject: 'Password Reset - Roi Beauty Essence',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #4a7c59 0%, #3a6548 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">Roi Beauty Essence</h1>
                        <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">Premium Skincare Solutions</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                        
                        <p>Hello <strong>${user.name}</strong>,</p>
                        
                        <p>You recently requested to reset your password. Click the button below to reset it.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="display: inline-block; background: linear-gradient(135deg, #4a7c59 0%, #3a6548 100%); 
                                      color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; 
                                      font-weight: bold; font-size: 16px;">
                                 Reset Your Password
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            <strong>Important:</strong> This link expires in <strong>1 hour</strong>.
                        </p>
                        
                        <p>If you didn't request this, please ignore this email.</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                        
                        <div style="color: #888; font-size: 12px; text-align: center;">
                            <p>Roi Beauty Essence Team</p>
                            <p><a href="http://roibeautyessence.netlify.app" style="color: #4a7c59;">roibeautyessence.netlify.app</a></p>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 Password reset email sent to:', user.email);
        
        res.json({
            success: true,
            message: 'Password reset instructions have been sent to your email.'
        });

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

// POST /api/auth/reset-password/:token - Reset password with token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        console.log('🔄 Password reset attempt with token');
        
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Hash the provided token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log('❌ Invalid or expired reset token');
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token. Please request a new password reset.'
            });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        console.log('✅ Password reset successful for user:', user.email);

        res.json({
            success: true,
            message: 'Password has been reset successfully! You can now log in with your new password.'
        });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
});

// ADD THIS NEW ROUTE TO FIX THE CONTACT FORM ERROR:
// POST /api/auth/contact - Handle contact form submissions
router.post('/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        console.log('📧 Contact form submission:', { name, email });
        
        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message'
            });
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }
        
        // Send confirmation email
        const mailOptions = {
            from: '"Roi Beauty Essence" <scentsbyroi@gmail.com>',
            to: email,
            subject: 'Thank you for contacting Roi Beauty Essence!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #4a7c59 0%, #3a6548 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">Roi Beauty Essence</h1>
                        <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">Premium Skincare Solutions</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-top: 0;">Thank You, ${name}!</h2>
                        
                        <p>We have received your message and will get back to you within 24 hours.</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <h4 style="color: #555; margin-top: 0;">Your Message:</h4>
                            <p style="color: #666; font-style: italic;">"${message}"</p>
                        </div>
                        
                        <p>If you have any urgent questions, please email us directly at:</p>
                        <p style="text-align: center;">
                            <a href="mailto:support@roibeautyessence.com" style="color: #4a7c59; font-weight: bold;">
                                support@roibeautyessence.com
                            </a>
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
                        
                        <div style="color: #888; font-size: 12px; text-align: center;">
                            <p>Roi Beauty Essence Customer Service Team</p>
                            <p><a href="http://roibeautyessence.netlify.app" style="color: #4a7c59;">roibeautyessence.netlify.app</a></p>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 Contact confirmation email sent to:', email);
        
        // Also send notification to admin
        const adminMailOptions = {
            from: '"Roi Beauty Essence Contact Form" <scentsbyroi@gmail.com>',
            to: process.env.ADMIN_EMAIL || 'scentsbyroi@gmail.com',
            subject: 'New Contact Form Submission',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>New Contact Form Submission</h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Message:</strong> ${message}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <p>Please respond within 24 hours.</p>
                </div>
            `
        };

        await transporter.sendMail(adminMailOptions);
        console.log('📧 Admin notification sent');

        res.json({
            success: true,
            message: 'Your message has been sent successfully! We will get back to you soon.'
        });

    } catch (error) {
        console.error('❌ Contact form error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again.' 
        });
    }
});

module.exports = router;