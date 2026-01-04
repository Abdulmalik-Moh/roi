const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1556228578-9d360e1d8d34?w=400'
    },
    category: {
        type: String,
        required: true,
        enum: ['cleansers', 'serums', 'moisturizers', 'masks', 'eye-care', 'toners', 'sunscreen', 'treatment']
    },
    skinType: [{
        type: String,
        enum: ['dry', 'oily', 'combination', 'sensitive', 'normal', 'all']
    }],
    badge: {
        type: String,
        enum: ['Bestseller', 'New', 'Sale', ''],
        default: ''
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    inStock: {
        type: Boolean,
        default: true
    },
    stockQuantity: {
        type: Number,
        default: 10,
        min: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numReviews: {
        type: Number,
        default: 0
    },
    lowStockThreshold: {
        type: Number,
        default: 5
    }
}, {
    timestamps: true
});

// Virtual for checking low stock
productSchema.virtual('isLowStock').get(function() {
    return this.stockQuantity <= this.lowStockThreshold;
});

// Indexes for better performance
productSchema.index({ category: 1, skinType: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;