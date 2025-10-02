// backend/schemas/resolvers/userResolvers.js
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { AuthenticationError, UserInputError } from 'apollo-server-express';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const userResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await User.findById(user.id);
    },
  },

  Mutation: {
    signup: async (_, { input }) => {
      const { name, email, password } = input;
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new UserInputError('User already exists with this email');
      }

      const user = await User.create({ name, email, password });
      const token = signToken(user._id);

      return { token, user };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !(await user.correctPassword(password, user.password))) {
        throw new AuthenticationError('Incorrect email or password');
      }

      const token = signToken(user._id);
      return { token, user };
    },
  },

  // Add User field resolvers if needed
  User: {
    // Field resolvers for User type
  }
};

// Use named export
export { userResolvers };