const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    credentials: true
}));

// Serve static files
app.use(express.static('public'));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});

// Add this route to index.js (after the health check route)
app.get('/api/debug-featured', async (req, res) => {
    try {
        const Product = require('./models/product');
        
        // Count all products
        const totalProducts = await Product.countDocuments();
        
        // Count featured products
        const featuredCount = await Product.countDocuments({ isFeatured: true });
        
        // Get all products with isFeatured field
        const allProducts = await Product.find({}, 'id name isFeatured');
        
        // Get featured products using the same query as your route
        const featuredProducts = await Product.find({ 
            isFeatured: true, 
            inStock: true 
        }).limit(4);
        
        res.json({
            success: true,
            debug: {
                totalProducts,
                featuredCount,
                featuredProductsCount: featuredProducts.length,
                allProducts: allProducts,
                featuredProducts: featuredProducts
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Debug route
app.get('/api/debug', (req, res) => {
    res.json({
        success: true,
        message: 'Debug endpoint working',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Import routes
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const paymentRouter = require('./routes/stripe');
const ordersRouter = require('./routes/orders');
const reviewsRouter = require('./routes/reviews');
const adminRouter = require('./routes/admin');
const contactRouter = require('./routes/contact');

// Use routes
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/payment', paymentRouter);
console.log('🔍 Payment router mounted at /api/payment');
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/contact', contactRouter);

// ✅ FIXED: Custom 404 handler for API routes
app.use((req, res, next) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: `API endpoint not found: ${req.method} ${req.url}`
        });
    }
    next();
});

// API root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Roi Beauty Essence API',
        version: '1.0.0',
        endpoints: {
            products: '/api/products',
            auth: '/api/auth',
            payment: '/api/payment',
            orders: '/api/orders',
            admin: '/api/admin',
            contact: '/api/contact',
            health: '/api/health'
        }
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// MongoDB connection
const connectDB = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected successfully');
        
        // Auto-seed database
        await seedDatabase();
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

// Function to seed database with products
const seedDatabase = async () => {
    try {
        const Product = require('./models/product');
        
        // Drop collection for clean start (optional - remove in production)
        // await Product.deleteMany({});
        
        const productCount = await Product.countDocuments();
        console.log(`📊 Current products in database: ${productCount}`);
        
        if (productCount === 0) {
            console.log('📦 Seeding database with sample products...');
            
            const sampleProducts = [
                {
                    id: 1,
                    name: "Hydrating Vitamin C Serum",
                    description: "Brightens skin tone and reduces dark spots with natural vitamin C extract",
                    price: 29.99,
                    image: "https://images.unsplash.com/photo-1556228578-9d360e1d8d34?w=400",
                    category: "serums",
                    skinType: ["dry", "combination", "sensitive"],
                    badge: "Bestseller",
                    isFeatured: true,
                    stockQuantity: 10,
                    rating: 4.8,
                    numReviews: 42
                },
                {
                    id: 2,
                    name: "Nourishing Face Moisturizer",
                    description: "Deeply hydrates and restores skin barrier with hyaluronic acid and ceramides",
                    price: 24.99,
                    image: "https://images.unsplash.com/photo-1556228578-9d360e1d8d34?w=400",
                    category: "moisturizers",
                    skinType: ["dry", "sensitive"],
                    badge: "New",
                    isFeatured: true,
                    stockQuantity: 15,
                    rating: 4.7,
                    numReviews: 38
                },
                {
                    id: 3,
                    name: "Gentle Foaming Cleanser",
                    description: "Removes impurities without stripping natural oils, suitable for all skin types",
                    price: 18.99,
                    image: "https://images.unsplash.com/photo-1556228578-9d360e1d8d34?w=400",
                    category: "cleansers",
                    skinType: ["dry", "oily", "combination", "sensitive"],
                    badge: "",
                    isFeatured: false,
                    stockQuantity: 20,
                    rating: 4.5,
                    numReviews: 56
                },
                {
                    id: 4,
                    name: "Revitalizing Eye Cream",
                    description: "Reduces puffiness and dark circles with caffeine and peptide complex",
                    price: 22.99,
                    originalPrice: 27.99,
                    image: "https://images.unsplash.com/photo-1556228578-9d360e1d8d34?w=400",
                    category: "eye-care",
                    skinType: ["dry", "combination", "sensitive"],
                    badge: "",
                    isFeatured: true,
                    stockQuantity: 8,
                    rating: 4.9,
                    numReviews: 29
                },
                {
                    id: 5,
                    name: "Detoxifying Clay Mask",
                    description: "Deep cleanses pores and absorbs excess oil with natural clay minerals",
                    price: 19.99,
                    image: "https://images.unsplash.com/photo-1556228578-9d360e1d8d34?w=400",
                    category: "masks",
                    skinType: ["oily", "combination"],
                    badge: "",
                    isFeatured: false,
                    stockQuantity: 12,
                    rating: 4.4,
                    numReviews: 31
                },
                {
                    id: 6,
                    name: "Hydrating Facial Mist",
                    description: "Instantly refreshes and hydrates skin with rosewater and aloe vera",
                    price: 16.99,
                    image: "https://images.unsplash.com/photo-1556228578-9d360e1d8d34?w=400",
                    category: "serums",
                    skinType: ["dry", "sensitive"],
                    badge: "",
                    isFeatured: false,
                    stockQuantity: 25,
                    rating: 4.6,
                    numReviews: 67
                },
                {
                    id: 7,
                    name: "Brightening Toner",
                    description: "Balances pH and improves skin texture with natural fruit extracts",
                    price: 21.99,
                    image: "https://images.unsplash.com/photo-1556228578-9d360e1d8d34?w=400",
                    category: "toners",
                    skinType: ["dry", "combination", "sensitive"],
                    badge: "",
                    isFeatured: false,
                    stockQuantity: 18,
                    rating: 4.7,
                    numReviews: 48
                },
                {
                    id: 8,
                    name: "Overnight Repair Cream",
                    description: "Intensive nighttime treatment that repairs skin while you sleep",
                    price: 34.99,
                    image: "https://images.unsplash.com/photo-1556228578-9d360e1d8d34?w=400",
                    category: "moisturizers",
                    skinType: ["dry", "sensitive"],
                    badge: "New",
                    isFeatured: true,
                    stockQuantity: 6,
                    rating: 4.8,
                    numReviews: 52
                }
            ];

            await Product.insertMany(sampleProducts);
            console.log('✅ Database seeded with 8 products');
            
            // Mark featured products
            await Product.updateMany(
                { id: { $in: [1, 2, 4, 8] } },
                { $set: { isFeatured: true } }
            );
            console.log('⭐ Marked 4 products as featured');
            
        } else {
            // Ensure featured products are marked
            const featuredCount = await Product.countDocuments({ isFeatured: true });
            console.log(`⭐ Already have ${productCount} products, ${featuredCount} are featured`);
            
            if (featuredCount === 0) {
                await Product.updateMany(
                    { id: { $in: [1, 2, 4, 8] } },
                    { $set: { isFeatured: true } }
                );
                console.log('⭐ Marked 4 products as featured');
            }
        }
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
};

// Force seed endpoint (for manual seeding)
app.get('/api/seed-database', async (req, res) => {
    try {
        await seedDatabase();
        res.json({
            success: true,
            message: 'Database seeded successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to seed database',
            error: error.message
        });
    }
});

// Setup featured products endpoint
app.post('/api/setup-featured', async (req, res) => {
    try {
        const Product = require('./models/product');
        
        // Reset all products
        await Product.updateMany({}, { $set: { isFeatured: false } });
        
        // Mark specific products as featured
        await Product.updateMany(
            { id: { $in: [1, 2, 4, 8] } },
            { $set: { isFeatured: true } }
        );
        
        const featuredProducts = await Product.find({ isFeatured: true });
        
        res.json({
            success: true,
            message: `Set ${featuredProducts.length} products as featured`,
            data: featuredProducts
        });
    } catch (error) {
        console.error('Setup featured error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to setup featured products'
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Ready' : 'Not configured'}`);
        console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Ready' : 'Not configured'}`);
    });
});