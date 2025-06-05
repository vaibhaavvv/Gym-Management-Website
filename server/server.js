import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from './config/mongodb.js'
import authRouter from './routes/authRoutes.js'
import userRouter from "./routes/userRoutes.js";
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const port = process.env.PORT || 4000;

// FIXED: Enhanced CORS configuration for cookie support
app.use(cors({
  origin: [
    'http://localhost:4000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true, // This is crucial for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Enhanced middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser()); // This must be before routes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log cookies
app.use((req, res, next) => {
  console.log('Request cookies:', req.cookies);
  next();
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// Health check
app.get('/', (req, res) => res.send("VR Fitness Empire API Running"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});