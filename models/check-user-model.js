
const mongoose = require('mongoose');
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
    
    try {
        // Try to load the User model
        let User;
        try {
            User = require('./models/User');
        } catch (error) {
            console.log('❌ Could not load User model. Trying alternative paths...');
            
            // Try common paths
            const paths = [
                './models/user',
                './models/user.js',
                './models/User.js',
                '../models/User'
            ];
            
            for (const path of paths) {
                try {
                    User = require(path);
                    console.log(`✅ Found User model at: ${path}`);
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            if (!User) {
                console.log('❌ Could not find User model. Creating minimal test...');
                
                // Create a minimal User model for testing
                User = mongoose.model('User', new mongoose.Schema({
                    name: String,
                    email: String,
                    password: String,
                    role: String,
                    isAdmin: Boolean
                }));
            }
        }
        
        // Check if there are any users
        const userCount = await User.countDocuments();
        console.log(`📊 Total users in database: ${userCount}`);
        
        if (userCount === 0) {
            console.log('ℹ️ No users found in database');
            process.exit(0);
        }
        
        // Get first 5 users
        const users = await User.find({}).limit(5);
        
        console.log('\n👥 First 5 users in database:');
        console.log('='.repeat(80));
        
        users.forEach((user, index) => {
            console.log(`\nUser ${index + 1}:`);
            console.log(`  ID: ${user._id}`);
            console.log(`  Email: ${user.email || 'N/A'}`);
            console.log(`  Name: ${user.name || 'N/A'}`);
            
            // Check for admin fields
            console.log(`  Role: ${user.role !== undefined ? user.role : 'Not set'}`);
            console.log(`  isAdmin: ${user.isAdmin !== undefined ? user.isAdmin : 'Not set'}`);
            
            // Check all fields
            console.log(`  All fields:`);
            Object.keys(user.toObject()).forEach(key => {
                if (!key.startsWith('_') && key !== '__v') {
                    console.log(`    ${key}: ${user[key]}`);
                }
            });
        });
        
        console.log('\n' + '='.repeat(80));
        
        // Check User model schema
        console.log('\n🔍 Checking User model schema...');
        
        try {
            const sampleUser = await User.findOne();
            if (sampleUser && sampleUser.constructor && sampleUser.constructor.schema) {
                const schemaPaths = sampleUser.constructor.schema.paths;
                console.log('\nSchema fields:');
                Object.keys(schemaPaths).forEach(key => {
                    const path = schemaPaths[key];
                    console.log(`  ${key}: ${path.instance} ${path.isRequired ? '(required)' : ''}`);
                });
            } else {
                console.log('⚠️ Could not access schema information');
            }
        } catch (schemaError) {
            console.log('⚠️ Error accessing schema:', schemaError.message);
        }
        
        // Create a test admin user if none exists
        const adminUser = await User.findOne({ 
            $or: [
                { role: 'admin' },
                { isAdmin: true }
            ]
        });
        
        if (!adminUser) {
            console.log('\n⚠️ No admin users found!');
            console.log('\nTo create an admin user:');
            console.log('1. Find a user ID from above');
            console.log('2. Run in MongoDB shell:');
            console.log('   db.users.updateOne({_id: ObjectId("USER_ID_HERE")}, {$set: {role: "admin"}})');
            console.log('\nOr create a new admin user with this script:');
            console.log('node create-admin.js');
        } else {
            console.log(`\n✅ Found admin user: ${adminUser.email} (Role: ${adminUser.role || 'N/A'}, isAdmin: ${adminUser.isAdmin || 'N/A'})`);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
