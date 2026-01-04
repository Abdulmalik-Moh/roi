const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const mongoose = require('mongoose');

// GET /api/reviews/user - Get user's reviews
router.get('/user', async (req, res) => {
    try {
        console.log('⭐ Fetching user reviews...');
        
        // Get token from header
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        console.log('👤 User ID for reviews:', userId);

        const reviews = await Review.find({ user: userId })
            .populate('product', 'name image')
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${reviews.length} reviews for user`);
        
        res.json({
            success: true,
            data: reviews,
            count: reviews.length
        });
    } catch (error) {
        console.error('❌ Get user reviews error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews'
        });
    }
});

// GET /api/reviews - Get all reviews (for testing)
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name')
            .populate('product', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reviews,
            count: reviews.length
        });
    } catch (error) {
        console.error('Get all reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews'
        });
    }
});

// POST /api/reviews/test - Create test review
router.post('/test', async (req, res) => {
    try {
        console.log('🧪 Creating test review...');
        
        // Create a random product ID for testing
        const productId = new mongoose.Types.ObjectId();
        
        const review = new Review({
            user: new mongoose.Types.ObjectId(), // Random user ID
            product: productId,
            rating: 5,
            comment: 'This is an excellent product! Really improved my skin texture and glow. Would definitely recommend to others.',
            isVerified: true
        });

        await review.save();

        console.log('✅ Test review created');

        res.status(201).json({
            success: true,
            message: 'Test review created successfully',
            data: review
        });
    } catch (error) {
        console.error('❌ Create test review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating test review: ' + error.message
        });
    }
});

// GET /api/reviews/test-success - Test endpoint
router.get('/test-success', (req, res) => {
    res.json({
        success: true,
        message: 'Reviews endpoint is working!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;