// backend/schemas/resolvers/analyticsResolvers.js
import Note from '../../models/Note.js';
import Comment from '../../models/Comment.js';
import { AuthenticationError } from 'apollo-server-express';

const analyticsResolvers = {
  Query: {
    getAnalytics: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      // Total notes count
      const totalNotes = await Note.countDocuments({ author: user.id });
      
      // Total comments count
      const totalComments = await Comment.countDocuments({ author: user.id });
      
      // Notes created this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const notesCreatedThisWeek = await Note.countDocuments({
        author: user.id,
        createdAt: { $gte: oneWeekAgo }
      });

      // Most active note (by view count)
      const mostActiveNote = await Note.findOne({ author: user.id })
        .sort({ viewCount: -1 })
        .populate('author');

      // Weekly activity data (last 7 days)
      const weeklyActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const notesCreated = await Note.countDocuments({
          author: user.id,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const commentsAdded = await Comment.countDocuments({
          author: user.id,
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        weeklyActivity.push({
          date: dateStr,
          notesCreated,
          commentsAdded
        });
      }

      return {
        totalNotes,
        totalComments,
        notesCreatedThisWeek,
        mostActiveNote,
        weeklyActivity
      };
    },
  },
};

// Use named export
export { analyticsResolvers };