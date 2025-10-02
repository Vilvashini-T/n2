// backend/schemas/resolvers/commentResolvers.js
import Comment from '../../models/Comment.js';
import Note from '../../models/Note.js';
import User from '../../models/User.js';
import { AuthenticationError, UserInputError } from 'apollo-server-express';

const commentResolvers = {
  Query: {},

  Mutation: {
    addComment: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      // Check if note exists
      const note = await Note.findById(input.noteId);
      if (!note) throw new UserInputError('Note not found');

      const comment = new Comment({
        text: input.text,
        author: user.id,
        note: input.noteId
      });

      await comment.save();
      await comment.populate('author');
      return comment;
    },

    updateComment: async (_, { id, text }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const comment = await Comment.findById(id);
      if (!comment) throw new UserInputError('Comment not found');
      
      if (!comment.author.equals(user.id)) {
        throw new AuthenticationError('Not authorized to update this comment');
      }

      comment.text = text;
      await comment.save();
      await comment.populate('author');
      return comment;
    },

    deleteComment: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const comment = await Comment.findById(id);
      if (!comment) throw new UserInputError('Comment not found');
      
      if (!comment.author.equals(user.id)) {
        throw new AuthenticationError('Not authorized to delete this comment');
      }

      await Comment.findByIdAndDelete(id);
      return true;
    },
  },

  // Comment field resolvers
  Comment: {
    author: async (comment) => {
      return await User.findById(comment.author);
    },
    note: async (comment) => {
      return await Note.findById(comment.note);
    },
  },
};

// Use named export
export { commentResolvers };