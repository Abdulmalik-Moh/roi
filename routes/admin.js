
const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/User');
const Review = require('../models/review');
const { requireAuth } = require('../helper/jwt');
const emailService = require('../utils/emailService');

// Middleware to check admin role
const checkAdmin = async (req, res, next) => {
    try {
        // Get user from token
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user is admin
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if user has admin role
        // If your User model doesn't have a 'role' field, you can use 'isAdmin' or create one
        const isAdmin = user.role === 'admin' || user.isAdmin === true;
        
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error checking admin privileges'
        });
    }
};

// All admin routes use checkAdmin middleware
router.use(checkAdmin);

// GET /api/admin/check-setup - Check if user has admin access and show user info
router.get('/check-setup', async (req, res) => {
    try {
        // User is already verified as admin by middleware
        const user = req.user;
        
        res.json({
            success: true,
            message: 'Admin access verified',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'N/A',
                isAdmin: user.isAdmin || false,
                createdAt: user.createdAt
            },
            instructions: {
                note: 'To make a user an admin, update their role field to "admin" in the database',
                steps: [
                    '1. Check if your User model has a "role" field or "isAdmin" field',
                    '2. Update the user document in MongoDB:',
                    '   - Using MongoDB Compass: Find user and set role: "admin"',
                    '   - Using Mongoose: User.findByIdAndUpdate(userId, { role: "admin" })',
                    '3. If no role field exists, you may need to add it to your User schema'
                ]
            }
        });
    } catch (error) {
        console.error('Admin setup check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking admin setup'
        });
    }
});

// POST /api/admin/make-admin - Make a user admin (only for initial setup)
router.post('/make-admin', async (req, res) => {
    try {
        // This endpoint should be protected or removed after initial setup
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check User model schema to see what field to update
        let updateData = {};
        let updatedField = '';
        
        // Try different possible admin fields
        if (user.schema && user.schema.paths.role) {
            updateData.role = 'admin';
            updatedField = 'role';
        } else if (user.schema && user.schema.paths.isAdmin) {
            updateData.isAdmin = true;
            updatedField = 'isAdmin';
        } else {
            // Default to adding role field
            updateData.role = 'admin';
            updatedField = 'role (new field)';
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            updateData,
            { new: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: `User ${email} is now an admin`,
            updatedField: updatedField,
            user: updatedUser
        });
        
    } catch (error) {
        console.error('Make admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error making user admin'
        });
    }
});

// GET /api/admin/debug-user-model - Debug user model structure
router.get('/debug-user-model', async (req, res) => {
    try {
        // Get a sample user to see schema
        const sampleUser = await User.findOne();
        
        if (!sampleUser) {
            return res.json({
                success: true,
                message: 'No users found in database',
                schemaFields: 'No users to inspect'
            });
        }
        
        // Get schema paths if available
        let schemaInfo = {};
        if (sampleUser.schema && sampleUser.schema.paths) {
            schemaInfo = Object.keys(sampleUser.schema.paths).map(key => ({
                field: key,
                type: sampleUser.schema.paths[key].instance,
                isRequired: sampleUser.schema.paths[key].isRequired || false
            }));
        }
        
        res.json({
            success: true,
            userModelInfo: {
                totalUsers: await User.countDocuments(),
                sampleUser: {
                    id: sampleUser._id,
                    email: sampleUser.email,
                    // Safely check for common fields
                    name: sampleUser.name || 'N/A',
                    role: sampleUser.role || 'N/A',
                    isAdmin: sampleUser.isAdmin || 'N/A'
                },
                schemaFields: schemaInfo,
                recommendedAction: schemaInfo.length > 0 
                    ? 'Check if "role" or "isAdmin" field exists above'
                    : 'Add a "role" field to your User schema with default value "user"'
            }
        });
    } catch (error) {
        console.error('Debug user model error:', error);
        res.status(500).json({
            success: false,
            message: 'Error debugging user model'
        });
    }
});

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        // Get counts
        const [
            totalOrders,
            totalProducts,
            totalUsers,
            pendingOrders,
            completedOrders,
            lowStockProducts
        ] = await Promise.all([
            Order.countDocuments(),
            Product.countDocuments(),
            User.countDocuments(),
            Order.countDocuments({ orderStatus: 'pending' }),
            Order.countDocuments({ orderStatus: 'delivered' }),
            Product.countDocuments({ stockQuantity: { $lte: 5 } })
        ]);

        // Get total revenue
        const revenueResult = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // Get recent orders
        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get monthly revenue (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const monthlyRevenue = await Order.aggregate([
            { 
                $match: { 
                    isPaid: true,
                    createdAt: { $gte: sixMonthsAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 6 }
        ]);

        res.json({
            success: true,
            data: {
                totals: {
                    orders: totalOrders,
                    revenue: totalRevenue,
                    products: totalProducts,
                    users: totalUsers
                },
                orderStatus: {
                    pending: pendingOrders,
                    completed: completedOrders
                },
                inventory: {
                    lowStock: lowStockProducts.length
                },
                recentOrders,
                monthlyRevenue,
                lowStockProducts
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// [Rest of the admin routes remain the same as before...]
// GET /api/admin/orders, PUT /api/admin/orders/:id, etc.

module.exports = router;
