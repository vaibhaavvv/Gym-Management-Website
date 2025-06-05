import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database Connected");
    } catch (error) {
        console.error("Database Connection Error:", error);
        process.exit(1);
    }
};

export default connectDB;