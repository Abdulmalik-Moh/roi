const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const mongoose = require('mongoose'); // ADD THIS LINE

// GET /api/products - Get all products with filtering
router.get('/', async (req, res) => {
    try {
        const { category, skinType, priceRange, search, page = 1, limit = 12 } = req.query;
        
        // Build filter object
        let filter = {};
        
        // Category filter
        if (category && category !== 'all') {
            filter.category = category;
        }
        
        // Skin type filter
        if (skinType && skinType !== 'all') {
            filter.skinType = skinType;
        }
        
        // Price range filter
        if (priceRange && priceRange !== 'all') {
            switch (priceRange) {
                case 'under20':
                    filter.price = { $lt: 20 };
                    break;
                case '20to40':
                    filter.price = { $gte: 20, $lte: 40 };
                    break;
                case 'over40':
                    filter.price = { $gt: 40 };
                    break;
            }
        }
        
        // Search filter
        if (search && search.trim() !== '') {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Only filter by inStock if explicitly requested
if (req.query.inStock === 'true') {
   // filter.inStock = true; //
}
        
        console.log('🔍 Product filter:', filter);
        
        // Execute query with pagination
        const products = await Product.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        
        // Get total count for pagination
        const total = await Product.countDocuments(filter);
        
        res.json({
            success: true,
            data: products,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
        
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products from database',
            error: error.message
        });
    }
});

// GET /api/products/featured - Get featured products
// In products.js, change the featured route to:
router.get('/featured', async (req, res) => {
    try {
        console.log('⭐ Fetching featured products...');
        const featuredProducts = await Product.find({ 
            isFeatured: true
            // Removed: inStock: true 
        }).limit(4);
        
        console.log(`✅ Found ${featuredProducts.length} featured products`);
        
        res.json({
            success: true,
            data: featuredProducts
        });
    } catch (error) {
        console.error('❌ Error fetching featured products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching featured products',
            error: error.message
        });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log('🔍 Fetching product details for ID:', productId);
        
        let product;
        
        // Try by MongoDB ID first
        if (mongoose.Types.ObjectId.isValid(productId)) {
            product = await Product.findById(productId);
        }
        
        // If not found, try by numeric ID
        if (!product) {
            product = await Product.findOne({ id: parseInt(productId) });
        }
        
        if (!product) {
            console.log('❌ Product not found for ID:', productId);
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        console.log('✅ Product found:', product.name);
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('❌ Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product details',
            error: error.message
        });
    }
});

// POST /api/products/setup-featured - Setup featured products (Admin)
router.post('/setup-featured', async (req, res) => {
    try {
        // Reset all products to not featured first
        await Product.updateMany({}, { $set: { isFeatured: false } });
        
        // Mark specific products as featured
        const featuredProductIds = [1, 2, 4, 8];
        await Product.updateMany(
            { id: { $in: featuredProductIds } },
            { $set: { isFeatured: true } }
        );
        
        const featuredProducts = await Product.find({ isFeatured: true });
        
        res.json({
            success: true,
            message: `Set ${featuredProducts.length} products as featured`,
            data: featuredProducts
        });
    } catch (error) {
        console.error('Error setting up featured products:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting up featured products'
        });
    }
});

module.exports = router;