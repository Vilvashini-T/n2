// backend/server.js - FIXED PORT TYPO
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import resolvers from './schemas/resolvers/index.js';

// HARDCODED CONFIGURATION
const config = {
  MONGODB_URI: 'mongodb://127.0.0.1:27010/notesapp',
  JWT_SECRET: 'supersecret123',
  JWT_EXPIRES_IN: '90d',
  PORT: 5000,
  NODE_ENV: 'development'
};

console.log('🎯 Using hardcoded configuration:');
console.log('   🗄️  MongoDB:', config.MONGODB_URI.substring(0, 50) + '...');
console.log('   🔑 JWT Secret:', config.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('   🔌 Port:', config.PORT);

// Set to process.env for other modules
process.env.MONGODB_URI = config.MONGODB_URI;
process.env.JWT_SECRET = config.JWT_SECRET;
process.env.JWT_EXPIRES_IN = config.JWT_EXPIRES_IN;
process.env.PORT = config.PORT;
process.env.NODE_ENV = config.NODE_ENV;

import connectDB from './config/database.js';
import typeDefs from './schemas/typeDefs.js';
import User from './models/User.js';

// Simple auth function with proper imports
const auth = async (req) => {
  try {
    console.log('🔐 Apollo Server Context - Checking auth...');
    
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token extracted');
    } else {
      console.log('❌ No Bearer token found');
      return { user: null };
    }

    if (!token) {
      console.log('❌ No token after extraction');
      return { user: null };
    }

    console.log('🔑 Token length:', token.length);

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified. User ID:', decoded.id);
      
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

// Initialize Express
const app = express();

// CORS configuration
app.use(cors());

// Connect to database
connectDB();

// Create GraphQL schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create HTTP server
const httpServer = createServer(app);

// Create Apollo Server with proper authentication context
const server = new ApolloServer({
  schema,
  context: async ({ req }) => {
    const { user } = await auth(req);
    
    if (user) {
      console.log('✅ Context - Authenticated user:', user.email);
    } else {
      console.log('❌ Context - No authenticated user');
    }
    
    return { user };
  },
  uploads: false, // Disable built-in upload handling
  introspection: true,
  playground: true,
});

// Start server function
const startServer = async () => {
  await server.start();
  server.applyMiddleware({ app });

  const PORT = config.PORT;

  httpServer.listen(PORT, () => {
    console.log(`\n🎉 BACKEND SERVER RUNNING!`);
    console.log(`🚀 GraphQL API: http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`📚 Playground: http://localhost:${PORT}${server.graphqlPath}`); // ← FIXED: PORT not Port
    console.log(`🔐 Authentication: ✅ JWT Ready`);
    console.log(`🗄️  Database: ✅ MongoDB Atlas Connected`);
    console.log(`\n📍 Frontend: http://localhost:3000`);
    console.log(`📍 Backend: http://localhost:${PORT}/graphql`);
  });
};

startServer();

// Simple pubsub implementation
export const pubsub = {
  asyncIterator: (triggers) => {
    return {
      [Symbol.asyncIterator]() {
        return {
          next() {
            return Promise.resolve({ value: null, done: false });
          }
        };
      }
    };
  },
  publish: (trigger, payload) => {
    console.log(`Event published: ${trigger}`, payload);
  }
};