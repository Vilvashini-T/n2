// backend/schemas/resolvers/noteResolvers.js
import Note from '../../models/Note.js';
import Comment from '../../models/Comment.js';
import User from '../../models/User.js';
import { AuthenticationError, UserInputError } from 'apollo-server-express';

const noteResolvers = {
  Query: {
    getAllNotes: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      return await Note.find({
        $or: [{ author: user.id }, { sharedWith: user.id }]
      })
      .populate('author')
      .populate('sharedWith')
      .sort({ updatedAt: -1 });
    },

    getNote: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const note = await Note.findById(id)
        .populate('author')
        .populate('sharedWith');
      
      if (!note) throw new UserInputError('Note not found');
      
      // Check permissions
      if (!note.author._id.equals(user.id) && 
          !note.sharedWith.some(sharedUser => sharedUser._id.equals(user.id)) &&
          !note.isPublic) {
        throw new AuthenticationError('Not authorized to view this note');
      }

      // Increment view count
      note.viewCount += 1;
      await note.save();

      return note;
    },
  },

  Mutation: {
    createNote: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const note = new Note({
        ...input,
        author: user.id
      });

      await note.save();
      await note.populate('author');
      return note;
    },

    updateNote: async (_, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const note = await Note.findById(id);
      if (!note) throw new UserInputError('Note not found');
      
      if (!note.author.equals(user.id)) {
        throw new AuthenticationError('Not authorized to update this note');
      }

      const updatedNote = await Note.findByIdAndUpdate(
        id,
        { ...input, lastEditedAt: new Date() },
        { new: true }
      ).populate('author').populate('sharedWith');

      return updatedNote;
    },

    // CORRECTED deleteNote function
    deleteNote: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const note = await Note.findById(id);
      if (!note) {
        throw new UserInputError('Note not found');
      }
      
      // Check if user owns the note (use author, not user)
      if (!note.author.equals(user.id)) {
        throw new AuthenticationError('Not authorized to delete this note');
      }
      
      // Delete associated comments first
      await Comment.deleteMany({ note: id });
      
      // Delete the note
      await Note.findByIdAndDelete(id);
      
      return { 
        success: true,
        message: 'Note deleted successfully' 
      };
    }
  }, // <-- This closes the Mutation object

  // Note field resolvers
  Note: {
    comments: async (note) => {
      return await Comment.find({ note: note.id }).populate('author');
    },
  },
};

// Use named export
export { noteResolvers };