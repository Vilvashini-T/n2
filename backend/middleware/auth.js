// backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req) => {
  try {
    console.log('🔐 Auth Middleware - Checking authentication...');
    console.log('📨 Headers:', req.headers);
    
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token found in headers');
    } else {
      console.log('❌ No Bearer token found in headers');
      return { user: null };
    }

    if (!token) {
      console.log('❌ No token provided after parsing');
      return { user: null };
    }

    console.log('🔑 Token received:', token.substring(0, 20) + '...');
    console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified successfully for user:', decoded.id);
      
      // Get user from database
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log('❌ User not found in database for ID:', decoded.id);
        return { user: null };
      }

      console.log('✅ User authenticated:', user.email);
      return { user };
    } catch (jwtError) {
      console.log('❌ JWT Verification failed:', jwtError.message);
      return { user: null };
    }
  } catch (error) {
    console.log('❌ Auth middleware error:', error.message);
    return { user: null };
  }
};

export default auth;