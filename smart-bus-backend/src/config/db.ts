import mongoose from 'mongoose';

/*
  Function to connect the application to MongoDB Atlas
 */
const connectDB = async () => {
  try {
    // Fetch the connection string from environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI || '');

    console.log(`MongoDB Connected: ${conn.connection.host} 🛡️`);
  } catch (error) {
    // Log any errors and exit the process if connection fails
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1); 
  }
};

export default connectDB;