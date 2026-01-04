const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        // Alternative configuration for other email services
        /*
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        */
    }

    // Send order confirmation email
    async sendOrderConfirmation(order, user) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || '"RoiBeauty" <noreply@roibeauty.com>',
                to: user.email,
                subject: `Order Confirmation - #${order.orderNumber || order.orderId}`,
                html: this.generateOrderConfirmationTemplate(order, user)
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Order confirmation email sent to ${user.email}`);
            return true;
        } catch (error) {
            console.error('❌ Order confirmation email failed:', error);
            return false;
        }
    }

    // Send order status update email
    async sendOrderStatusUpdate(order, user, status) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || '"RoiBeauty" <noreply@roibeauty.com>',
                to: user.email,
                subject: `Order Update - #${order.orderNumber || order.orderId}`,
                html: this.generateStatusUpdateTemplate(order, user, status)
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Status update email sent to ${user.email}`);
            return true;
        } catch (error) {
            console.error('❌ Status update email failed:', error);
            return false;
        }
    }

    // Send email verification email
    async sendVerificationEmail(user, verificationToken) {
        try {
            const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&userId=${user._id}`;
            
            const mailOptions = {
                from: process.env.EMAIL_USER || '"RoiBeauty" <noreply@roibeauty.com>',
                to: user.email,
                subject: 'Verify Your RoiBeauty Account',
                html: this.generateVerificationTemplate(user, verificationLink)
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Verification email sent to ${user.email}`);
            return true;
        } catch (error) {
            console.error('❌ Verification email failed:', error);
            return false;
        }
    }

    // Send password reset email
    async sendPasswordResetEmail(user, resetToken) {
        try {
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&userId=${user._id}`;
            
            const mailOptions = {
                from: process.env.EMAIL_USER || '"RoiBeauty" <noreply@roibeauty.com>',
                to: user.email,
                subject: 'Reset Your Password - RoiBeauty',
                html: this.generatePasswordResetTemplate(user, resetLink)
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Password reset email sent to ${user.email}`);
            return true;
        } catch (error) {
            console.error('❌ Password reset email failed:', error);
            return false;
        }
    }

    // Send welcome email after verification
    async sendWelcomeEmail(user) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || '"RoiBeauty" <noreply@roibeauty.com>',
                to: user.email,
                subject: 'Welcome to RoiBeauty!',
                html: this.generateWelcomeTemplate(user)
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Welcome email sent to ${user.email}`);
            return true;
        } catch (error) {
            console.error('❌ Welcome email failed:', error);
            return false;
        }
    }

    // Send admin notification for new order
    async sendAdminOrderNotification(order) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || '"RoiBeauty" <noreply@roibeauty.com>',
                to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                subject: `New Order Received - #${order.orderNumber || order.orderId}`,
                html: this.generateAdminNotificationTemplate(order)
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Admin notification sent for order #${order.orderNumber || order.orderId}`);
            return true;
        } catch (error) {
            console.error('❌ Admin notification email failed:', error);
            return false;
        }
    }

    // ==================== TEMPLATE GENERATORS ====================

    generateOrderConfirmationTemplate(order, user) {
        const itemsHTML = order.orderItems ? order.orderItems.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    <img src="${item.image || 'https://via.placeholder.com/50'}" 
                         alt="${item.name}" 
                         width="50" 
                         style="border-radius: 5px;">
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${item.name}
                    ${item.sku ? `<br><small style="color: #666;">SKU: ${item.sku}</small>` : ''}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    ${item.quantity}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    €${(item.price || 0).toFixed(2)}
                </td>
            </tr>
        `).join('') : '<tr><td colspan="4" style="padding: 20px; text-align: center;">No items found</td></tr>';

        const orderNumber = order.orderNumber || order.orderId || 'N/A';
        const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : new Date().toLocaleDateString();

        const totalAmount = order.totalAmount || order.totalPrice || 0;

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Confirmation</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .header p {
                        margin: 10px 0 0;
                        opacity: 0.9;
                    }
                    .content {
                        padding: 40px;
                    }
                    .order-info {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    .order-info h2 {
                        margin-top: 0;
                        color: #333;
                        font-size: 20px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin-top: 15px;
                    }
                    .info-item {
                        margin-bottom: 10px;
                    }
                    .info-label {
                        font-weight: 600;
                        color: #666;
                        font-size: 14px;
                        margin-bottom: 5px;
                    }
                    .info-value {
                        color: #333;
                        font-size: 16px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th {
                        background-color: #f8f9fa;
                        padding: 12px;
                        text-align: left;
                        font-weight: 600;
                        color: #555;
                        border-bottom: 2px solid #dee2e6;
                    }
                    .total-row {
                        font-weight: bold;
                        font-size: 18px;
                        background-color: #f8f9fa;
                    }
                    .footer {
                        text-align: center;
                        padding: 30px;
                        background-color: #f8f9fa;
                        color: #666;
                        font-size: 14px;
                        border-top: 1px solid #dee2e6;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background-color: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: 600;
                        margin: 20px 0;
                    }
                    @media (max-width: 600px) {
                        .info-grid {
                            grid-template-columns: 1fr;
                        }
                        .content {
                            padding: 20px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Thank You for Your Order!</h1>
                        <p>Order #${orderNumber}</p>
                    </div>
                    
                    <div class="content">
                        <p>Hi <strong>${user.name}</strong>,</p>
                        <p>Your order has been confirmed and is being processed. We'll notify you when it ships.</p>
                        
                        <div class="order-info">
                            <h2>Order Details</h2>
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="info-label">Order Date</div>
                                    <div class="info-value">${orderDate}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Order Number</div>
                                    <div class="info-value">${orderNumber}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Payment Status</div>
                                    <div class="info-value" style="color: #4CAF50;">Paid</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Order Status</div>
                                    <div class="info-value">Processing</div>
                                </div>
                            </div>
                        </div>

                        <h2>Order Summary</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 15%; text-align: center;">Image</th>
                                    <th style="width: 45%;">Product</th>
                                    <th style="width: 15%; text-align: center;">Quantity</th>
                                    <th style="width: 25%; text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML}
                                <tr class="total-row">
                                    <td colspan="3" style="text-align: right; padding: 15px;">Total:</td>
                                    <td style="text-align: right; padding: 15px;">€${totalAmount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders" class="button">
                                View Your Orders
                            </a>
                        </div>

                        <p style="margin-top: 30px;">If you have any questions about your order, please contact our support team at <a href="mailto:support@roibeauty.com">support@roibeauty.com</a>.</p>
                        
                        <p>Thank you for choosing RoiBeauty!</p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} RoiBeauty. All rights reserved.</p>
                        <p>This email was sent to ${user.email}.</p>
                        <p>If you didn't place this order, please contact us immediately.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateStatusUpdateTemplate(order, user, status) {
        const statusMessages = {
            processing: 'is being processed',
            shipped: 'has been shipped',
            delivered: 'has been delivered',
            cancelled: 'has been cancelled',
            refunded: 'has been refunded'
        };

        const statusColors = {
            processing: '#3498db',
            shipped: '#2ecc71',
            delivered: '#27ae60',
            cancelled: '#e74c3c',
            refunded: '#9b59b6'
        };

        const message = statusMessages[status] || 'status has been updated';
        const color = statusColors[status] || '#667eea';
        const orderNumber = order.orderNumber || order.orderId || 'N/A';

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Status Update</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 40px;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 8px 20px;
                        background-color: ${color};
                        color: white;
                        border-radius: 20px;
                        font-weight: 600;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .order-info {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .tracking-info {
                        background: #e8f4fd;
                        border-left: 4px solid #3498db;
                        padding: 15px;
                        margin: 20px 0;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background-color: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: 600;
                        margin: 20px 0;
                    }
                    .footer {
                        text-align: center;
                        padding: 30px;
                        background-color: #f8f9fa;
                        color: #666;
                        font-size: 14px;
                        border-top: 1px solid #dee2e6;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Order Status Update</h1>
                        <p>Order #${orderNumber}</p>
                    </div>
                    
                    <div class="content">
                        <p>Hi <strong>${user.name}</strong>,</p>
                        
                        <p>Your order <strong>${message}</strong>.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <span class="status-badge">${status}</span>
                        </div>
                        
                        <div class="order-info">
                            <h3 style="margin-top: 0;">Order Details</h3>
                            <p><strong>Order Number:</strong> ${orderNumber}</p>
                            <p><strong>Order Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                            <p><strong>Total Amount:</strong> €${(order.totalAmount || order.totalPrice || 0).toFixed(2)}</p>
                        </div>

                        ${status === 'shipped' && order.trackingNumber ? `
                        <div class="tracking-info">
                            <h3 style="margin-top: 0;">Tracking Information</h3>
                            <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
                            ${order.shippingCarrier ? `<p><strong>Shipping Carrier:</strong> ${order.shippingCarrier}</p>` : ''}
                            <p>You can track your package using the tracking number above on the carrier's website.</p>
                        </div>
                        ` : ''}

                        ${status === 'delivered' ? `
                        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #155724;">Your Order Has Been Delivered!</h3>
                            <p style="color: #155724;">We hope you enjoy your purchase. If you have any questions or concerns, please don't hesitate to contact us.</p>
                        </div>
                        ` : ''}

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderNumber}" class="button">
                                View Order Details
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px;">If you have any questions, please contact our support team.</p>
                        
                        <p>Thank you for shopping with RoiBeauty!</p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} RoiBeauty. All rights reserved.</p>
                        <p>This email was sent to ${user.email}.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateVerificationTemplate(user, verificationLink) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 40px;
                    }
                    .verification-code {
                        font-size: 32px;
                        font-weight: bold;
                        text-align: center;
                        letter-spacing: 5px;
                        color: #667eea;
                        margin: 30px 0;
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        border: 2px dashed #dee2e6;
                    }
                    .button {
                        display: inline-block;
                        padding: 15px 40px;
                        background-color: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: 600;
                        font-size: 16px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .benefits {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 30px 0;
                    }
                    .benefits ul {
                        list-style: none;
                        padding: 0;
                    }
                    .benefits li {
                        padding: 10px 0;
                        border-bottom: 1px solid #dee2e6;
                    }
                    .benefits li:last-child {
                        border-bottom: none;
                    }
                    .benefits i {
                        color: #4CAF50;
                        margin-right: 10px;
                    }
                    .warning {
                        background: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        color: #856404;
                    }
                    .footer {
                        text-align: center;
                        padding: 30px;
                        background-color: #f8f9fa;
                        color: #666;
                        font-size: 14px;
                        border-top: 1px solid #dee2e6;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Verify Your Email</h1>
                        <p>Welcome to RoiBeauty!</p>
                    </div>
                    
                    <div class="content">
                        <p>Hi <strong>${user.name}</strong>,</p>
                        
                        <p>Thank you for registering with RoiBeauty! Please verify your email address to activate your account and access all features.</p>
                        
                        <div class="verification-code">
                            <a href="${verificationLink}" style="color: #667eea; text-decoration: none;">
                                Verify Email Address
                            </a>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${verificationLink}" class="button">
                                Click to Verify
                            </a>
                        </div>
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            Or copy and paste this link in your browser:<br>
                            <span style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; display: inline-block; margin-top: 10px;">
                                ${verificationLink}
                            </span>
                        </p>
                        
                        <div class="warning">
                            <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
                        </div>
                        
                        <div class="benefits">
                            <h3 style="margin-top: 0;">Verification Benefits:</h3>
                            <ul>
                                <li><i class="fas fa-check"></i> Access your order history</li>
                                <li><i class="fas fa-check"></i> Save multiple shipping addresses</li>
                                <li><i class="fas fa-check"></i> Write product reviews</li>
                                <li><i class="fas fa-check"></i> Receive exclusive member discounts</li>
                                <li><i class="fas fa-check"></i> Track your orders in real-time</li>
                            </ul>
                        </div>
                        
                        <p>If you didn't create this account, you can safely ignore this email.</p>
                        
                        <p>Best regards,<br>The RoiBeauty Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} RoiBeauty. All rights reserved.</p>
                        <p>This email was sent to ${user.email}.</p>
                        <p>If you need help, contact us at <a href="mailto:support@roibeauty.com">support@roibeauty.com</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generatePasswordResetTemplate(user, resetLink) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 40px;
                    }
                    .reset-code {
                        font-size: 32px;
                        font-weight: bold;
                        text-align: center;
                        letter-spacing: 5px;
                        color: #e74c3c;
                        margin: 30px 0;
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        border: 2px dashed #dee2e6;
                    }
                    .button {
                        display: inline-block;
                        padding: 15px 40px;
                        background-color: #e74c3c;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: 600;
                        font-size: 16px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .security-note {
                        background: #f8d7da;
                        border-left: 4px solid #dc3545;
                        padding: 15px;
                        margin: 20px 0;
                        color: #721c24;
                    }
                    .instructions {
                        background: #f8f9fa;
                        border-radius: 8px;
                        padding: 20px;
                        margin: 30px 0;
                    }
                    .instructions ol {
                        padding-left: 20px;
                    }
                    .instructions li {
                        margin-bottom: 10px;
                    }
                    .footer {
                        text-align: center;
                        padding: 30px;
                        background-color: #f8f9fa;
                        color: #666;
                        font-size: 14px;
                        border-top: 1px solid #dee2e6;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Reset Your Password</h1>
                        <p>RoiBeauty Account Security</p>
                    </div>
                    
                    <div class="content">
                        <p>Hi <strong>${user.name}</strong>,</p>
                        
                        <p>We received a request to reset your password for your RoiBeauty account.</p>
                        
                        <div class="reset-code">
                            <a href="${resetLink}" style="color: #e74c3c; text-decoration: none;">
                                Reset Password
                            </a>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${resetLink}" class="button">
                                Reset Password Now
                            </a>
                        </div>
                        
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            Or copy and paste this link in your browser:<br>
                            <span style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; display: inline-block; margin-top: 10px;">
                                ${resetLink}
                            </span>
                        </p>
                        
                        <div class="security-note">
                            <p><strong>Security Alert:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
                        </div>
                        
                        <div class="instructions">
                            <h3 style="margin-top: 0;">For your security:</h3>
                            <ol>
                                <li>Use a strong, unique password</li>
                                <li>Don't reuse passwords from other sites</li>
                                <li>Consider using a password manager</li>
                                <li>Enable two-factor authentication if available</li>
                            </ol>
                        </div>
                        
                        <p>If you have any questions or need further assistance, please contact our support team.</p>
                        
                        <p>Best regards,<br>The RoiBeauty Security Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} RoiBeauty. All rights reserved.</p>
                        <p>This email was sent to ${user.email}.</p>
                        <p>If you didn't request this reset, contact us at <a href="mailto:support@roibeauty.com">support@roibeauty.com</a></p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateWelcomeTemplate(user) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to RoiBeauty!</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 32px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 40px;
                    }
                    .welcome-message {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .features {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                        margin: 30px 0;
                    }
                    .feature {
                        text-align: center;
                        padding: 20px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        transition: transform 0.3s;
                    }
                    .feature:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    }
                    .feature i {
                        font-size: 30px;
                        color: #667eea;
                        margin-bottom: 15px;
                    }
                    .button {
                        display: inline-block;
                        padding: 15px 40px;
                        background-color: #4a7c59;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: 600;
                        font-size: 16px;
                        margin: 20px 0;
                    }
                    .discount {
                        background: linear-gradient(135deg, #4a7c59, #3a6548);
                        color: white;
                        padding: 25px;
                        border-radius: 8px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .discount h3 {
                        margin-top: 0;
                        font-size: 24px;
                    }
                    .discount-code {
                        font-size: 36px;
                        font-weight: bold;
                        letter-spacing: 3px;
                        margin: 15px 0;
                    }
                    .footer {
                        text-align: center;
                        padding: 30px;
                        background-color: #f8f9fa;
                        color: #666;
                        font-size: 14px;
                        border-top: 1px solid #dee2e6;
                    }
                    @media (max-width: 600px) {
                        .features {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to RoiBeauty!</h1>
                        <p>Your journey to beautiful skin starts here</p>
                    </div>
                    
                    <div class="content">
                        <div class="welcome-message">
                            <h2>Hello, ${user.name}!</h2>
                            <p>Thank you for verifying your email and joining the RoiBeauty community!</p>
                        </div>
                        
                        <div class="discount">
                            <h3>Welcome Gift!</h3>
                            <p>Enjoy 15% off your first order</p>
                            <div class="discount-code">WELCOME15</div>
                            <p>Use this code at checkout. Valid for 30 days.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/catalog" class="button">
                                Start Shopping Now
                            </a>
                        </div>
                        
                        <h3 style="text-align: center;">What You Can Do Now:</h3>
                        <div class="features">
                            <div class="feature">
                                <i class="fas fa-shopping-bag"></i>
                                <h4>Shop Products</h4>
                                <p>Browse our curated collection of skincare essentials</p>
                            </div>
                            <div class="feature">
                                <i class="fas fa-truck"></i>
                                <h4>Track Orders</h4>
                                <p>Follow your orders from checkout to delivery</p>
                            </div>
                            <div class="feature">
                                <i class="fas fa-star"></i>
                                <h4>Write Reviews</h4>
                                <p>Share your experience with our products</p>
                            </div>
                            <div class="feature">
                                <i class="fas fa-heart"></i>
                                <h4>Save Favorites</h4>
                                <p>Create your personal wishlist</p>
                            </div>
                        </div>
                        
                        <p style="text-align: center; margin-top: 30px;">
                            Need help? Visit our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/help">Help Center</a> or contact our support team.
                        </p>
                        
                        <p>We're excited to have you as part of our community!</p>
                        
                        <p>Best regards,<br>The RoiBeauty Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} RoiBeauty. All rights reserved.</p>
                        <p>This email was sent to ${user.email}.</p>
                        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe">Unsubscribe</a> from marketing emails</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    generateAdminNotificationTemplate(order) {
        const orderNumber = order.orderNumber || order.orderId || 'N/A';
        const customerName = order.shippingAddress?.fullName || order.user?.name || 'Guest';
        const customerEmail = order.email || order.user?.email || 'No email';
        const totalAmount = order.totalAmount || order.totalPrice || 0;
        const itemCount = order.orderItems ? order.orderItems.length : 0;

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Order Notification</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container {
                        max-width: 700px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #4a7c59 0%, #3a6548 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }
                    .alert-badge {
                        background: #e74c3c;
                        color: white;
                        padding: 8px 20px;
                        border-radius: 20px;
                        font-weight: bold;
                        font-size: 14px;
                        display: inline-block;
                        margin-top: 10px;
                    }
                    .content {
                        padding: 30px;
                    }
                    .order-highlight {
                        background: #f8f9fa;
                        border-left: 4px solid #4a7c59;
                        padding: 20px;
                        margin: 20px 0;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .info-item {
                        padding: 10px;
                        background: #f8f9fa;
                        border-radius: 5px;
                    }
                    .info-label {
                        font-weight: 600;
                        color: #666;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .info-value {
                        color: #333;
                        font-size: 16px;
                        margin-top: 5px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th {
                        background-color: #f1f1f1;
                        padding: 12px;
                        text-align: left;
                        font-weight: 600;
                        color: #555;
                        border-bottom: 2px solid #ddd;
                    }
                    .action-buttons {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .admin-button {
                        display: inline-block;
                        padding: 12px 25px;
                        background-color: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: 600;
                        margin: 0 10px;
                    }
                    .footer {
                        text-align: center;
                        padding: 20px;
                        background-color: #f8f9fa;
                        color: #666;
                        font-size: 12px;
                        border-top: 1px solid #dee2e6;
                    }
                    @media (max-width: 600px) {
                        .info-grid {
                            grid-template-columns: 1fr;
                        }
                        .action-buttons {
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                        }
                        .admin-button {
                            margin: 5px 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🛒 New Order Received</h1>
                        <div class="alert-badge">Action Required</div>
                    </div>
                    
                    <div class="content">
                        <div class="order-highlight">
                            <h2 style="margin-top: 0;">Order #${orderNumber}</h2>
                            <p style="font-size: 18px; font-weight: bold;">Total: €${totalAmount.toFixed(2)}</p>
                        </div>
                        
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Customer</div>
                                <div class="info-value">${customerName}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Email</div>
                                <div class="info-value">${customerEmail}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Items</div>
                                <div class="info-value">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Order Time</div>
                                <div class="info-value">${new Date(order.createdAt || Date.now()).toLocaleString()}</div>
                            </div>
                        </div>

                        ${order.shippingAddress ? `
                        <div style="margin: 25px 0;">
                            <h3 style="margin-bottom: 10px;">Shipping Address</h3>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                                <p style="margin: 5px 0;"><strong>Name:</strong> ${order.shippingAddress.fullName}</p>
                                <p style="margin: 5px 0;"><strong>Address:</strong> ${order.shippingAddress.address}</p>
                                <p style="margin: 5px 0;"><strong>City:</strong> ${order.shippingAddress.city}, ${order.shippingAddress.zipCode}</p>
                                <p style="margin: 5px 0;"><strong>Country:</strong> ${order.shippingAddress.country}</p>
                                ${order.shippingAddress.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${order.shippingAddress.phone}</p>` : ''}
                            </div>
                        </div>
                        ` : ''}

                        ${order.orderItems && order.orderItems.length > 0 ? `
                        <h3>Order Items</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th style="text-align: right;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.orderItems.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td style="text-align: right;">€${(item.price || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                                <tr style="font-weight: bold; background-color: #f8f9fa;">
                                    <td colspan="2" style="text-align: right; padding: 15px;">Total:</td>
                                    <td style="text-align: right; padding: 15px;">€${totalAmount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        ` : ''}

                        <div class="action-buttons">
                            <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}/orders/${orderNumber}" class="admin-button">
                                View Order in Admin
                            </a>
                            <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}" class="admin-button" style="background-color: #4a7c59;">
                                Go to Admin Panel
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; text-align: center;">
                            This is an automated notification. Please process this order within 24 hours.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} RoiBeauty Admin System</p>
                        <p>Order notification for ${orderNumber}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Test email service
    async testEmailService() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service is ready');
            return true;
        } catch (error) {
            console.error('❌ Email service not configured:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
