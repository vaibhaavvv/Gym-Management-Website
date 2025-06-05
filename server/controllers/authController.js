import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import usermodel from '../models/usermodel.js';
import { transporter } from '../config/nodemailer.js';

export const register = async(req, res) => {
    try {
        const {email, password, name} = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({success: false, message: "All fields are required"})
        }
        
        // Check if user already exists
        const ExistsUser = await usermodel.findOne({email})
        if (ExistsUser) {
            return res.status(400).json({success: false, message: "User already exists! Please Login."})
        }
        
        const hashPassword = await bcrypt.hash(password, 10)

        const user = new usermodel({
            email,
            password: hashPassword,
            name,
            isAccountVerified: false
        })
        await user.save()

        // Send verification OTP immediately after registration
        try {
            const otp = String(Math.floor(100000 + Math.random() * 900000));
            
            user.verifyOtp = otp;
            user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
            await user.save();

            const mailOptions = {
                from: `"VR Fitness Empire" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Welcome to VR Fitness Empire - Verify Your Account",
                html: `
                    <h2>Welcome to VR Fitness Empire!</h2>
                    <p>Hello ${name},</p>
                    <p>Thank you for registering with us. Please verify your email address using the OTP below:</p>
                    <h3 style="color: #e74c3c; font-size: 24px; text-align: center; padding: 10px; border: 2px solid #e74c3c; display: inline-block;">${otp}</h3>
                    <p>This OTP will expire in 24 hours.</p>
                    <p>If you didn't create this account, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>VR Fitness Empire Team</p>
                `,
                text: `Welcome ${name}! Your verification OTP is: ${otp}. This OTP will expire in 24 hours.`,
            };

            await transporter.sendMail(mailOptions);
            console.log('Verification OTP sent successfully to:', email);
        } catch (emailError) {
            console.log('Failed to send verification email:', emailError.message);
        }

        return res.status(200).json({
            success: true, 
            message: "Registration successful! Please check your email for verification code.",
            email: user.email
        });
        
    } catch (error) {
        console.log('Registration error:', error)
        return res.status(500).json({success: false, message: "Server Error!"})
    }
}

export const sendVerifyOtp = async(req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: "Email is required" 
            });
        }
        
        const user = await usermodel.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        if (user.isAccountVerified) {
            return res.status(200).json({
                success: true, 
                message: "Account already verified"
            });
        }

        // Generate OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        const mailOptions = {
            from: `"VR Fitness Empire" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Account Verification OTP - VR Fitness Empire",
            html: `
                <h2>Account Verification</h2>
                <p>Your verification OTP is:</p>
                <h3 style="color: #e74c3c; font-size: 24px; text-align: center; padding: 10px; border: 2px solid #e74c3c; display: inline-block;">${otp}</h3>
                <p>This OTP will expire in 24 hours.</p>
                <p>Please use this OTP to verify your account.</p>
                <br>
                <p>Best regards,<br>VR Fitness Empire Team</p>
            `,
            text: `Your OTP is ${otp}. This OTP will expire in 24 hours.`,
        };

        await transporter.sendMail(mailOptions);
        console.log('OTP sent successfully to:', email);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {
        console.log("Send OTP Error:", error);
        return res.status(500).json({
            success: false, 
            message: "Failed to send OTP"
        });
    }
}

export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        console.log('Verification request:', { email, otp });
        
        if (!email || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and OTP are required" 
            });
        }
        
        const user = await usermodel.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        if (user.isAccountVerified) {
            return res.status(200).json({ 
                success: true, 
                message: "Account is already verified" 
            });
        }

        if (!user.verifyOtp || user.verifyOtp.toString() !== otp.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid OTP" 
            });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ 
                success: false, 
                message: "OTP has expired. Please request a new one." 
            });
        }

        // Update user verification status
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();
        
        console.log('User verified successfully:', user.email);
        
        return res.status(200).json({ 
            success: true, 
            message: "Email verified successfully! You can now login." 
        });
        
    } catch (error) {
        console.error("Email verification error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error during verification"
        });
    }
}

export const login = async(req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false, 
                message: "Email and Password are required"
            })
        }
        
        const user = await usermodel.findOne({email});
        if (!user) {
            return res.status(400).json({
                success: false, 
                message: "Invalid Email or Password"
            })
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false, 
                message: "Invalid Email or Password"
            })
        }
        
        // Check if account is verified
        if (!user.isAccountVerified) {
            return res.status(403).json({ 
                success: false, 
                message: "Account not verified. Please verify your email first.",
                needsVerification: true,
                email: user.email
            });
        }
        
        // Create JWT token
        const tokenPayload = {
            id: user._id.toString(),
            email: user.email,
            isVerified: user.isAccountVerified
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        // FIXED: Set cookie with proper options for development
        const cookieOptions = {
            httpOnly: true,
            secure: false, // Set to false for development (localhost)
            sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
            domain: 'localhost' // Explicitly set domain for localhost
        };

        // For production, use secure settings
        if (process.env.NODE_ENV === 'production') {
            cookieOptions.secure = true;
            cookieOptions.sameSite = 'none';
            delete cookieOptions.domain; // Remove domain for production
        }

        res.cookie('token', token, cookieOptions);
        
        console.log('Token set in cookie:', token.substring(0, 20) + '...');
        console.log('Cookie options:', cookieOptions);
        
        const responseData = {
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isAccountVerified
            }
        };
        
        return res.status(200).json(responseData);

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false, 
            message: "Server Error!"
        })
    }
}

export const isAuthenticated = async(req, res) => {
    try {
        return res.status(200).json({ 
            success: true,
            message: "User is authenticated",
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                isVerified: req.user.isAccountVerified
            }
        });
    } catch (error) {
        console.error("Authentication check error:", error);
        return res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
}

export const logout = async(req, res) => {
    try {
        const cookieOptions = {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            domain: 'localhost'
        };

        if (process.env.NODE_ENV === 'production') {
            cookieOptions.secure = true;
            cookieOptions.sameSite = 'none';
            delete cookieOptions.domain;
        }

        res.clearCookie('token', cookieOptions);
        
        return res.status(200).json({
            success: true, 
            message: "Logged out successfully"
        });
        
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false, 
            message: "Server Error!"
        })
    }
}

export const sendResetOtp = async(req, res) => {
    const {email} = req.body;

    if (!email) {
        return res.status(400).json({
            success: false, 
            message: "Email is required"
        });
    }
    
    try {
        const user = await usermodel.findOne({email});
        if (!user) {
            // For security, don't reveal if user exists or not
            console.log('Password reset requested for non-existent email:', email);
            return res.status(200).json({ 
                success: true, 
                message: "If this email is registered, you'll receive an OTP shortly."
            });
        }

        if (!user.isAccountVerified) {
            console.log('Password reset requested for unverified account:', email);
            return res.status(403).json({ 
                success: false, 
                message: "Account not verified. Please verify your email first."
            });
        }
        
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes

        await user.save();

        const mailOptions = {
            from: `"VR Fitness Empire" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Password Reset OTP - VR Fitness Empire",
            html: `
                <h2>Password Reset Request</h2>
                <p>Hello ${user.name},</p>
                <p>You requested to reset your password. Use the OTP below:</p>
                <h3 style="color: #e74c3c; font-size: 24px; text-align: center; padding: 10px; border: 2px solid #e74c3c; display: inline-block;">${otp}</h3>
                <p>This OTP will expire in 15 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <br>
                <p>Best regards,<br>VR Fitness Empire Team</p>
            `,
            text: `Your OTP for resetting your password is ${otp}. This OTP will expire in 15 minutes.`,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Password reset OTP sent to:', email);
        
        return res.status(200).json({ 
            success: true, 
            message: "OTP sent to your email."
        });

    } catch (error) {
        console.error("Send reset OTP error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to process reset request. Please try again later."
        });
    }
}

export const resetPassword = async(req, res) => {
    const {email, otp, newPassword} = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            message: "Email, OTP, and new password are required"
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: "Password must be at least 6 characters long"
        });
    }
    
    try {
        const user = await usermodel.findOne({email});
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "User not found"
            });
        }

        if (!user.isAccountVerified) {
            return res.status(403).json({ 
                success: false, 
                message: "Account not verified"
            });
        }
        
        if (user.resetOtp === '' || user.resetOtp !== otp) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid OTP" 
            });
        }
        
        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ 
                success: false, 
                message: "OTP Expired" 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({ 
            success: true, 
            message: "Password has been reset successfully."
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error during password reset"
        });
    }
}