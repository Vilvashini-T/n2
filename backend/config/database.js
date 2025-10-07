// backend/config/database.js - FIXED
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(mongoURI);
    // Remove deprecated options - they're no longer needed in Mongoose 7+
    
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;