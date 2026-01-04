const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const rateLimit = require('express-rate-limit');

// ✅ FIXED: Use mongoose to get the model
let Order;
try {
    Order = require('../models/order');
} catch (error) {
    console.warn('⚠️ Order model not found. Creating minimal schema.');
    const mongoose = require('mongoose');
    const orderSchema = new mongoose.Schema({
        orderId: String,
        orderNumber: String,
        userId: String, // Keep as String
        email: String,
        items: Array,
        shippingAddress: Object,
        totalAmount: Number,
        status: String,
        paymentMethod: String,
        paymentStatus: String,
        stripePaymentId: String,
        receiptUrl: String,
        paidAt: Date
    }, { timestamps: true });
    Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
}

// Rate limiting
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many payment attempts, please try again later'
    }
});

// Validation middleware
const validatePaymentRequest = (req, res, next) => {
    const { amount, cart } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Valid amount is required'
        });
    }
    
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Cart cannot be empty'
        });
    }
    
    next();
};

// Test route
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Stripe routes are working!',
        timestamp: new Date().toISOString(),
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY
    });
});

// Create payment intent - WITH BETTER ERROR HANDLING
router.post('/create-payment-intent', paymentLimiter, validatePaymentRequest, async (req, res) => {
    try {
        const { amount, cart, userId, email, shippingAddress } = req.body;
        
        console.log('💰 Creating Stripe payment intent:', {
            amount,
            items: cart?.length || 0,
            userId: userId || 'guest',
            email: email || 'guest'
        });
        
        // Validate amount
        const amountInCents = Math.round(parseFloat(amount) * 100);
        if (isNaN(amountInCents) || amountInCents < 50) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount. Minimum is 0.50 EUR'
            });
        }
        
        // Generate unique IDs
        const orderId = `RB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            metadata: {
                orderId: orderId,
                orderNumber: orderNumber,
                userId: userId || 'guest',
                email: email || 'guest',
                itemsCount: cart?.length || 0,
                items: JSON.stringify(cart || []),
                shippingAddress: JSON.stringify(shippingAddress || {})
            },
            description: `Order ${orderId} - ${cart?.length || 0} items`
        });
        
        console.log('✅ Payment intent created:', paymentIntent.id);
        
        // Save order to database - WITH PROPER ERROR HANDLING
        try {
            const orderData = {
                orderId: orderId,
                orderNumber: orderNumber,
                userId: userId || 'guest', // STRING, not ObjectId
                email: email || 'guest@example.com',
                items: cart || [],
                shippingAddress: shippingAddress || {},
                totalAmount: amount,
                status: 'pending',
                paymentMethod: 'stripe',
                paymentStatus: 'pending',
                stripePaymentId: paymentIntent.id
            };
            
            console.log('💾 Attempting to save order:', orderData);
            
            const newOrder = new Order(orderData);
            await newOrder.save();
            console.log('📝 Order saved to database:', orderId);
            
        } catch (dbError) {
            console.error('❌ DATABASE SAVE ERROR:', dbError.message);
            console.error('❌ Error details:', dbError);
            // Don't fail the entire request - payment intent was created
        }
        
        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            orderId: orderId,
            orderNumber: orderNumber,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        });
        
    } catch (error) {
        console.error('❌ Stripe payment intent error:', error);
        
        let errorMessage = 'Payment processing error';
        if (error.type === 'StripeCardError') {
            errorMessage = 'Your card was declined. Please try another card.';
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Confirm payment - WITH BETTER ORDER RECOVERY
router.post('/confirm-payment', paymentLimiter, async (req, res) => {
    console.log('🔍 Confirm payment called with:', req.body);
    
    try {
        const { paymentIntentId, orderId } = req.body;
        
        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment intent ID is required'
            });
        }
        
        // Verify with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                message: `Payment not completed. Status: ${paymentIntent.status}`,
                status: paymentIntent.status
            });
        }
        
        // Try to find existing order
        let order = await Order.findOne({ 
            $or: [
                { orderId: orderId },
                { stripePaymentId: paymentIntentId }
            ]
        });
        
        if (!order) {
            console.log('⚠️ Order not found in database, creating from payment intent metadata...');
            
            // Extract data from payment intent metadata
            const metadata = paymentIntent.metadata;
            
            // Create order from payment intent metadata
            order = new Order({
                orderId: metadata.orderId || orderId || `RB-${Date.now()}`,
                orderNumber: metadata.orderNumber || `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`,
                userId: metadata.userId || 'guest',
                email: metadata.email || 'customer@example.com',
                items: JSON.parse(metadata.items || '[]'),
                shippingAddress: JSON.parse(metadata.shippingAddress || '{}'),
                totalAmount: paymentIntent.amount / 100,
                status: 'paid',
                paymentMethod: 'stripe',
                paymentStatus: 'succeeded',
                stripePaymentId: paymentIntentId,
                paidAt: new Date()
            });
            
            await order.save();
            console.log('✅ Order recovered and saved from payment intent:', order.orderId);
        } else {
            // Update existing order
            order.paymentStatus = 'succeeded';
            order.status = 'paid';
            order.paidAt = new Date();
            
            if (paymentIntent.charges?.data?.[0]?.receipt_url) {
                order.receiptUrl = paymentIntent.charges.data[0].receipt_url;
            }
            
            await order.save();
            console.log('✅ Order updated:', order.orderId);
        }
        
        res.json({
            success: true,
            message: 'Payment successful! Order confirmed.',
            data: {
                orderId: order.orderId,
                orderNumber: order.orderNumber,
                paymentId: paymentIntent.id,
                amount: order.totalAmount,
                status: order.status,
                receiptUrl: order.receiptUrl
            }
        });
        
    } catch (error) {
        console.error('❌ Payment confirmation error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment confirmation failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin route to see all orders
router.get('/admin/all-orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        
        console.log(`📊 Found ${orders.length} orders in database`);
        
        res.json({
            success: true,
            count: orders.length,
            orders: orders.map(order => ({
                orderId: order.orderId,
                orderNumber: order.orderNumber,
                userId: order.userId,
                email: order.email,
                amount: order.totalAmount,
                status: order.status,
                paymentStatus: order.paymentStatus,
                createdAt: order.createdAt,
                stripePaymentId: order.stripePaymentId
            }))
        });
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch orders',
            error: error.message 
        });
    }
});

// Get specific order by orderId
router.get('/order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findOne({ orderId });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            order: order
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order'
        });
    }
});


console.log('✅ Stripe routes loaded');
module.exports = router;