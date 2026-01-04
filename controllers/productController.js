const Product = require('../product');

// Get all products with filtering and pagination
exports.getProducts = async (req, res) => {
    try {
        const { category, skinType, priceRange, search, page = 1, limit = 8 } = req.query;

        // Build filter object
        let filter = {};
        
        if (category && category !== 'all') {
            filter.category = category;
        }
        
        if (skinType && skinType !== 'all') {
            filter.skinType = skinType;
        }
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
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
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get single product
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Create product (Admin only)
exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};