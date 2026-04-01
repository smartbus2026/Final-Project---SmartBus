import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './Routes/authRoutes';

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json()); 

app.use("/api/auth", authRoutes);

// Basic test route
app.get('/', (req: Request, res: Response) => {
  res.send('SmartBus Backend is Running! ');
});

// Start the server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});