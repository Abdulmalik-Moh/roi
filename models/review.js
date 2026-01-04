const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Prevent duplicate reviews
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Update product rating when review is saved
reviewSchema.post('save', async function() {
    const Review = mongoose.model('Review');
    const Product = mongoose.model('Product');
    
    const stats = await Review.aggregate([
        { $match: { product: this.product } },
        { $group: {
            _id: '$product',
            averageRating: { $avg: '$rating' },
            numReviews: { $sum: 1 }
        }}
    ]);

    if (stats.length > 0) {
        await Product.findByIdAndUpdate(this.product, {
            rating: stats[0].averageRating,
            numReviews: stats[0].numReviews
        });
    }
});

module.exports = mongoose.model('Review', reviewSchema);