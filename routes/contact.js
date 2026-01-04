const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage'); // Make sure this path is correct

// POST /api/contact
router.post('/', async (req, res) => {
    try {
        console.log('📧 Received contact form data:', req.body);
        
        const { name, email, message } = req.body;
        
        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Create and save to MongoDB
        const contactMessage = new ContactMessage({
            name: name.trim(),
            email: email.trim(),
            message: message.trim()
        });

        const savedMessage = await contactMessage.save();
        console.log('✅ Contact message saved to MongoDB:', savedMessage._id);
        
        res.json({ 
            success: true, 
            message: 'Message sent successfully!',
            data: { id: savedMessage._id }
        });
        
    } catch (error) {
        console.error('❌ Contact message save error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save message. Please try again.' 
        });
    }
});

module.exports = router;