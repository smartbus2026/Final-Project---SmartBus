"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
/*
  Function to connect the application to MongoDB Atlas
 */
const connectDB = async () => {
    try {
        // Fetch the connection string from environment variables
        const conn = await mongoose_1.default.connect(process.env.MONGO_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host} 🛡️`);
    }
    catch (error) {
        // Log any errors and exit the process if connection fails
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
exports.default = connectDB;
