// models/Order.js - FIXED VERSION
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        }
    },
    userId: {
        type: String, // KEEP AS STRING (not ObjectId)
        default: 'guest'
    },
    email: {
        type: String,
        required: true
    },
    items: [{
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String
    }],
    shippingAddress: {
        fullName: String,
        address: String,
        city: String,
        postalCode: String,
        country: String,
        phone: String
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        default: 'stripe'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'succeeded', 'failed', 'refunded'],
        default: 'pending'
    },
    stripePaymentId: String,
    receiptUrl: String,
    paidAt: Date
}, {
    timestamps: true
});

// Check if model already exists
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
module.exports = Order;