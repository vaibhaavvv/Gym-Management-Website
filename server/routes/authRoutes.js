import express from 'express'
import { 
    isAuthenticated, 
    login, 
    logout, 
    register, 
    resetPassword, 
    sendResetOtp, 
    sendVerifyOtp, 
    verifyEmail 
} from '../controllers/authController.js'
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

// Public routes (no authentication required)
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/send-verify-otp', sendVerifyOtp);
authRouter.post('/verify-account', verifyEmail);
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);

// Protected routes (authentication required)
authRouter.get('/is-auth', userAuth, isAuthenticated);
authRouter.post('/logout', userAuth, logout);

// Test route for development (remove in production)
if (process.env.NODE_ENV === 'development') {
    authRouter.get('/test', (req, res) => {
        res.json({ 
            success: true, 
            message: 'Auth routes working',
            timestamp: new Date().toISOString()
        });
    });
}

/* 
// Uncomment for email testing in development
authRouter.get('/test-email', async (req, res) => {
    try {
        await transporter.verify();
        const info = await transporter.sendMail({
            from: '"VR Fitness Empire Test" <vaibhav.jconnect03@gmail.com>',
            to: 'kamalvaibhav111kv@gmail.com',
            subject: 'Test Email from VR Fitness Empire',
            text: 'This is a test email from VR Fitness Empire authentication system.',
            html: '<h2>Test Email</h2><p>This is a test email from VR Fitness Empire authentication system.</p>'
        });
        res.json({ 
            success: true, 
            message: 'Test email sent successfully', 
            info: info.messageId 
        });
    } catch (error) {
        console.error('Email test failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Email test failed',
            error: error.message 
        });
    }
});
*/

export default authRouter;