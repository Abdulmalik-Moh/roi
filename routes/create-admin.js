
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Try to load User model
    let User;
    try {
        User = require('./models/User');
    } catch (error) {
        console.log('❌ Could not load User model. Creating schema...');
        
        // Define a basic user schema
        const userSchema = new mongoose.Schema({
            name: String,
            email: { type: String, unique: true },
            password: String,
            role: { type: String, default: 'user' },
            isAdmin: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        });
        
        User = mongoose.model('User', userSchema);
    }
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
        console.log('ℹ️ Admin user already exists. Updating to admin role...');
        
        // Update to admin
        existingAdmin.role = 'admin';
        existingAdmin.isAdmin = true;
        await existingAdmin.save();
        
        console.log(`✅ Updated user ${existingAdmin.email} to admin`);
    } else {
        // Create new admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const adminUser = new User({
            name: 'Administrator',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            isAdmin: true
        });
        
        await adminUser.save();
        console.log('✅ Created admin user:');
        console.log(`   Email: admin@example.com`);
        console.log(`   Password: admin123`);
        console.log(`   Role: admin`);
        console.log('\n⚠️ IMPORTANT: Change the password immediately!');
    }
    
    // List all admin users
    const adminUsers = await User.find({
        $or: [
            { role: 'admin' },
            { isAdmin: true }
        ]
    });
    
    console.log('\n📋 All admin users:');
    adminUsers.forEach(user => {
        console.log(`  - ${user.email} (Role: ${user.role || 'N/A'}, isAdmin: ${user.isAdmin || 'N/A'})`);
    });
    
    process.exit(0);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
