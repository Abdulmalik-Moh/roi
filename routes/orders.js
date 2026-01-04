
const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const mongoose = require('mongoose');

// GET /api/orders/my-orders - Get authenticated user's orders
router.get('/my-orders', async (req, res) => {
    try {
        console.log('📦 Fetching user orders...');
        
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

        console.log('👤 User ID from token:', userId);
        console.log('🔍 Looking for orders where userId =', userId.toString());

        // Try different queries
        const orders = await Order.find({ 
            userId: userId.toString() 
        }).sort({ createdAt: -1 });
        
        console.log(`✅ Found ${orders.length} orders for user`);
        
        // Debug: Log what we found
        if (orders.length > 0) {
            console.log('📄 Orders found:', orders.map(o => ({
                orderId: o.orderId,
                userId: o.userId,
                email: o.email
            })));
        }
        
        res.json({
            success: true,
            data: orders,
            count: orders.length
        });
    } catch (error) {
        console.error('❌ Get user orders error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
});

// GET /api/orders - Get all orders (admin only)
router.get('/', async (req, res) => {
    try {
        // Check if user is admin (you might want to implement proper admin check)
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify token and check admin status
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add your admin check logic here
        // For example: if (!decoded.isAdmin) return res.status(403).json(...)
        
        const orders = await Order.find().sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: orders,
            count: orders.length
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order'
        });
    }
});

// PUT /api/orders/:id - Update order (admin only)
router.put('/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify token and check admin status
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add your admin check logic here
        // For example: if (!decoded.isAdmin) return res.status(403).json(...)
        
        const { 
            status, 
            shippingAddress, 
            paymentStatus, 
            isPaid, 
            paidAt, 
            isDelivered, 
            deliveredAt 
        } = req.body;
        
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Update fields
        if (status) order.status = status;
        if (shippingAddress) order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (isPaid !== undefined) order.isPaid = isPaid;
        if (paidAt) order.paidAt = paidAt;
        if (isDelivered !== undefined) order.isDelivered = isDelivered;
        if (deliveredAt) order.deliveredAt = deliveredAt;
        
        await order.save();
        
        res.json({
            success: true,
            message: 'Order updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order'
        });
    }
});

// PATCH /api/orders/:id/status - Update order status only
router.patch('/:id/status', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Verify token and check admin status
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add your admin check logic here
        
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
});

// POST /api/orders/ - Create new order
router.post('/', async (req, res) => {
    try {
        console.log('🛒 Creating new order...');
        
        const {
            userId,
            email,
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            isPaid,
            paidAt
        } = req.body;
        
        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const order = new Order({
            userId: userId || 'guest',
            email,
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            isPaid: isPaid || false,
            paidAt: isPaid ? paidAt || new Date() : null,
            status: 'pending',
            orderNumber,
            paymentStatus: isPaid ? 'paid' : 'pending'
        });
        
        await order.save();
        
        console.log(`✅ Order created: ${order.orderNumber}`);
        
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        console.error('❌ Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order: ' + error.message
        });
    }
});

// POST /api/orders/associate-guest - Associate guest orders with logged-in user
router.post('/associate-guest', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const { email } = req.body;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        // Verify token to get user ID
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        console.log(`🔗 Associating guest orders for email ${email} with user ${userId}`);
        
        // Update all orders with this email and userId = 'guest'
        const result = await Order.updateMany(
            { 
                email: email,
                userId: 'guest' 
            },
            { 
                $set: { userId: userId.toString() } 
            }
        );
        
        console.log(`✅ Associated ${result.modifiedCount} orders with user`);
        
        res.json({
            success: true,
            message: `Associated ${result.modifiedCount} orders with your account`,
            count: result.modifiedCount
        });
        
    } catch (error) {
        console.error('❌ Associate guest orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to associate orders'
        });
    }
});

// TESTING ENDPOINTS ----------------------------------------------------

// POST /api/orders/test - Create test order
router.post('/test', async (req, res) => {
    try {
        console.log('🧪 Creating test order...');
        
        const order = new Order({
            user: new mongoose.Types.ObjectId(), // Random user ID
            orderItems: [{
                name: 'Hydrating Vitamin C Serum',
                image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883',
                price: 29.99,
                quantity: 2
            }, {
                name: 'Nourishing Face Moisturizer', 
                image: 'https://images.unsplash.com/photo-1598440947619-2c35fc47bd2e',
                price: 24.99,
                quantity: 1
            }],
            shippingAddress: {
                fullName: 'Test User',
                email: 'test@example.com',
                address: '123 Test Street',
                city: 'London',
                zipCode: 'SW1A 1AA',
                country: 'United Kingdom'
            },
            paymentMethod: 'paypal',
            itemsPrice: 84.97,
            shippingPrice: 4.99,
            taxPrice: 8.50,
            totalPrice: 98.46,
            isPaid: true,
            paidAt: new Date(),
            orderStatus: 'processing',
            orderNumber: `TEST-${Date.now()}`
        });

        await order.save();

        console.log('✅ Test order created:', order.orderNumber);

        res.status(201).json({
            success: true,
            message: 'Test order created successfully',
            data: order
        });
    } catch (error) {
        console.error('❌ Create test order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating test order: ' + error.message
        });
    }
});

// DEBUG ENDPOINTS ----------------------------------------------------

// GET /api/orders/debug - Debug orders
router.get('/debug', async (req, res) => {
    try {
        // Get all orders
        const allOrders = await Order.find({}).sort({ createdAt: -1 });
        
        console.log(`📊 Total orders in database: ${allOrders.length}`);
        
        // Show structure of each order
        const debugInfo = allOrders.map(order => ({
            _id: order._id,
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            userId: order.userId,
            email: order.email,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            userIdType: typeof order.userId
        }));
        
        res.json({
            success: true,
            totalOrders: allOrders.length,
            orders: debugInfo
        });
        
    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug failed',
            error: error.message
        });
    }
});

// GET /api/orders/debug-all - Debug all orders with user info
router.get('/debug-all', async (req, res) => {
    try {
        const allOrders = await Order.find({}).sort({ createdAt: -1 });
        
        console.log(`📊 Total orders in database: ${allOrders.length}`);
        
        // Show each order's userId and email
        const debugOrders = allOrders.map(order => ({
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            userId: order.userId,
            userIdType: typeof order.userId,
            email: order.email,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
        }));
        
        res.json({
            success: true,
            count: allOrders.length,
            orders: debugOrders
        });
        
    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug failed',
            error: error.message
        });
    }
});

// GET /api/orders/test-success - Test endpoint
router.get('/test-success', (req, res) => {
    res.json({
        success: true,
        message: 'Orders endpoint is working!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
