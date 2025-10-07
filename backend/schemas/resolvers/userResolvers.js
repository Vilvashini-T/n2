// backend/schemas/resolvers/userResolvers.js
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { AuthenticationError, UserInputError } from 'apollo-server-express';

// Enhanced token signing with security options
const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'notes-app-backend',
    audience: 'notes-app-users',
    algorithm: 'HS256'
  });
};

// Input validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
};

const validateName = (name) => {
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters long';
  }
  if (name.trim().length > 50) {
    return 'Name must be less than 50 characters';
  }
  return null;
};

const userResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      // Enhanced authentication check
      if (!user) {
        throw new AuthenticationError('Not authenticated. Please log in.');
      }
      
      try {
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          throw new AuthenticationError('User not found. Please log in again.');
        }
        return currentUser;
      } catch (error) {
        console.error('Error in me query:', error);
        throw new AuthenticationError('Unable to fetch user data');
      }
    },
  },

  Mutation: {
    signup: async (_, { input }) => {
      const { name, email, password } = input;
      
      // Input validation
      if (!name || !email || !password) {
        throw new UserInputError('All fields are required');
      }
      
      // Email validation
      if (!validateEmail(email)) {
        throw new UserInputError('Please provide a valid email address');
      }
      
      // Name validation
      const nameError = validateName(name);
      if (nameError) {
        throw new UserInputError(nameError);
      }
      
      // Password validation
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new UserInputError(passwordError);
      }
      
      try {
        // Check for existing user (case-insensitive)
        const existingUser = await User.findOne({ 
          email: email.toLowerCase().trim() 
        });
        
        if (existingUser) {
          throw new UserInputError('User already exists with this email');
        }

        // Create user with trimmed and normalized data
        const user = await User.create({ 
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password 
        });
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        const token = signToken(user._id);

        console.log(`✅ New user registered: ${user.email}`);
        return { token, user: userResponse };
        
      } catch (error) {
        console.error('Signup error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
          throw new UserInputError('User already exists with this email');
        }
        
        // Re-throw Apollo errors, create new ones for others
        if (error instanceof UserInputError || error instanceof AuthenticationError) {
          throw error;
        }
        
        throw new UserInputError('Registration failed. Please try again.');
      }
    },

    login: async (_, { email, password }) => {
      // Input validation
      if (!email || !password) {
        throw new UserInputError('Email and password are required');
      }
      
      if (!validateEmail(email)) {
        throw new UserInputError('Please provide a valid email address');
      }
      
      try {
        // Find user with case-insensitive email
        const user = await User.findOne({ 
          email: email.toLowerCase().trim() 
        }).select('+password');
        
        if (!user) {
          console.log(`❌ Login attempt for non-existent user: ${email}`);
          throw new AuthenticationError('Incorrect email or password');
        }

        // Verify password
        const isPasswordCorrect = await user.correctPassword(password, user.password);
        if (!isPasswordCorrect) {
          console.log(`❌ Failed login attempt for user: ${user.email}`);
          throw new AuthenticationError('Incorrect email or password');
        }

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        const token = signToken(user._id);

        console.log(`✅ User logged in: ${user.email}`);
        return { token, user: userResponse };
        
      } catch (error) {
        console.error('Login error:', error);
        
        // Re-throw Apollo errors, create new ones for others
        if (error instanceof AuthenticationError || error instanceof UserInputError) {
          throw error;
        }
        
        throw new AuthenticationError('Login failed. Please try again.');
      }
    },

    // ADDITIONAL FEATURE: Update user profile
    updateProfile: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      const { name, theme } = input;
      
      try {
        const updateData = {};
        
        if (name) {
          const nameError = validateName(name);
          if (nameError) {
            throw new UserInputError(nameError);
          }
          updateData.name = name.trim();
        }
        
        if (theme) {
          if (!['light', 'dark'].includes(theme)) {
            throw new UserInputError('Theme must be either "light" or "dark"');
          }
          updateData.theme = theme;
        }
        
        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          updateData,
          { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
          throw new UserInputError('User not found');
        }
        
        return updatedUser;
        
      } catch (error) {
        console.error('Update profile error:', error);
        if (error instanceof UserInputError) {
          throw error;
        }
        throw new UserInputError('Failed to update profile');
      }
    },
  },

  // User field resolvers
  User: {
    // Ensure sensitive fields are never exposed
    id: (user) => user._id || user.id,
    email: (user) => user.email,
    // Add any computed fields if needed
  }
};

export { userResolvers };