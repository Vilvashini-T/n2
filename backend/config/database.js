// backend/config/database.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Use the MongoDB URI from process.env (set in server.js)
    const mongoURI = process.env.MONGODB_URI;
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;