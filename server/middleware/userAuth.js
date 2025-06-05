import jwt from 'jsonwebtoken';
import usermodel from '../models/usermodel.js';

const userAuth = async (req, res, next) => {
    try {
        // Get token from cookies with detailed logging
        const { token } = req.cookies;
        
        console.log('Auth middleware - All cookies:', req.cookies);
        console.log('Auth middleware - Token present:', !!token);
        console.log('Auth middleware - Token value:', token ? token.substring(0, 20) + '...' : 'No token');
        
        if (!token) {
            console.log('Auth middleware - No token found in cookies');
            return res.status(401).json({ 
                success: false, 
                message: "Not Authorized. Please login again.",
                code: "NO_TOKEN"
            });
        }

        let decoded;
        try {
            // Verify the token
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Auth middleware - Token decoded successfully for user:', decoded.id);
        } catch (jwtError) {
            console.log('JWT verification failed:', jwtError.message);
            
            // Clear invalid token with same options used to set it
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
            });
            
            return res.status(401).json({ 
                success: false, 
                message: "Invalid token. Please login again.",
                code: "INVALID_TOKEN"
            });
        }
        
        if (!decoded || !decoded.id) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid token payload. Please login again.",
                code: "INVALID_PAYLOAD"
            });
        }

        // Fetch user data
        const user = await usermodel.findById(decoded.id).select('-password');
        
        if (!user) {
            // Clear token for non-existent user
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
            });
            
            return res.status(401).json({ 
                success: false, 
                message: "User not found. Please login again.",
                code: "USER_NOT_FOUND"
            });
        }

        console.log('Auth middleware - User found:', user.email, 'Verified:', user.isAccountVerified);

        // Check if user account is verified
        if (!user.isAccountVerified) {
            return res.status(403).json({ 
                success: false, 
                message: "Account not verified. Please verify your email first.",
                code: "ACCOUNT_NOT_VERIFIED",
                needsVerification: true,
                email: user.email
            });
        }

        // Attach user to request object
        req.user = user;
        
        console.log('Auth middleware - Success for user:', user.email);
        next();

    } catch (error) {
        console.log("Auth middleware error:", error.message);
        
        // Clear potentially corrupted token
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
        });
        
        return res.status(401).json({ 
            success: false, 
            message: "Authentication failed. Please login again.",
            code: "AUTH_ERROR"
        });
    }
};

export default userAuth;