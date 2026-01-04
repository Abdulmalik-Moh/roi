const mongoose = require('mongoose');
const Product = require('../models/product');
require('dotenv').config();

const products = [
    {
        id: 1,
        name: "Hydrating Vitamin C Serum",
        description: "Brightens skin tone and reduces dark spots with natural vitamin C extract",
        price: 29.99,
        image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883",
        category: "serums",
        skinType: ["dry", "combination", "sensitive"],
        badge: "Bestseller",
        stockQuantity: 50,
        isFeatured: true
    },
    {
        id: 2,
        name: "Nourishing Face Moisturizer",
        description: "Deeply hydrates and restores skin barrier with hyaluronic acid and ceramides",
        price: 24.99,
        image: "https://images.unsplash.com/photo-1598440947619-2c35fc47bd2e",
        category: "moisturizers",
        skinType: ["dry", "sensitive"],
        badge: "New",
        stockQuantity: 75,
        isFeatured: true
    }
    // Add more products as needed
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skincare-store');
        console.log('Connected to MongoDB');
        
        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');
        
        // Insert new products
        await Product.insertMany(products);
        console.log('Products seeded successfully');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();