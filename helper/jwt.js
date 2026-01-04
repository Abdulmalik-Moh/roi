const { expressjwt: expressJwt } = require('express-jwt');
const jwt = require('jsonwebtoken');

function authJwt() {
    const secret = process.env.JWT_SECRET || 'your-super-secret-key-here';
    const api = process.env.API_URL || '/api';
    
    return expressJwt({
        secret,
        algorithms: ['HS256'],
        credentialsRequired: false, // Don't require auth for all routes
        isRevoked: isRevoked
    }).unless({
        path: [
            // Public routes that don't require authentication
            { url: /\/api\/products(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/categories(.*)/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/auth\/login/, methods: ['POST', 'OPTIONS'] },
            { url: /\/api\/auth\/register/, methods: ['POST', 'OPTIONS'] },
            { url: /\/api\/auth\/contact/, methods: ['POST', 'OPTIONS'] },
            { url: /\/api\/health/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/debug/, methods: ['GET', 'OPTIONS'] },
            { url: /\/api\/payment(.*)/, methods: ['POST', 'OPTIONS'] }
        ]
    });
}

async function isRevoked(req, token) {
    try {
        // You can add logic here to revoke tokens if needed
        // For example, check if user still exists in database
        // For now, we'll allow all valid tokens
        return false;
    } catch (error) {
        console.error('Token revocation check error:', error);
        return true; // Revoke token on error
    }
}

// Helper function to generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
            name: user.name
        },
        process.env.JWT_SECRET || 'your-super-secret-key-here',
        { expiresIn: '30d' }
    );
}

// Helper function to verify token
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-key-here');
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

// Middleware to check if user is authenticated (optional)
function requireAuth(req, res, next) {
    if (!req.auth || !req.auth.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
}

module.exports = { authJwt, generateToken, verifyToken, requireAuth };