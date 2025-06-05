import usermodel from "../models/usermodel.js";

export const getUserData = async (req, res) => {
    try {
        console.log("Request user object:", req.user); // Debug log
        
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: "User authentication failed"
            });
        }

        const user = await usermodel.findById(req.user._id)
            .select('-password -verifyOtp -resetOtp');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found in database"
            });
        }

        return res.status(200).json({
            success: true,
            userData: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAccountVerified: user.isAccountVerified
            }
        });
    } catch (error) {
        console.error("Error in getUserData:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}