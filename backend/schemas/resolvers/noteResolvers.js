import Note from '../../models/Note.js';
import SharedNote from '../../models/SharedNote.js';
import Comment from '../../models/Comment.js';
import User from '../../models/User.js';
import { AuthenticationError, UserInputError } from 'apollo-server-express';

const noteResolvers = {
  Query: {
    getMyNotes: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      return await Note.find({ author: user.id })
        .populate('author')
        .populate('sharedWith.user')
        .sort({ updatedAt: -1 });
    },

    // Get notes where user is in SHAREDWITH (not author)
    // In backend/schemas/resolvers/noteResolvers.js - getSharedWithMe query
getSharedWithMe: async (_, __, { user }) => {
  if (!user) throw new AuthenticationError('Not authenticated');
  
  console.log(`🔍 [BACKEND] Fetching shared notes for user: ${user.email} (${user.id})`);
  
  const sharedNotes = await Note.find({
    $and: [
      { 'sharedWith.user': user.id },
      { author: { $ne: user.id } }
    ]
  })
  .populate('author')
  .populate('sharedWith.user')
  .sort({ updatedAt: -1 });

  console.log(`✅ [BACKEND] Found ${sharedNotes.length} notes shared with user`);
  
  // Log each shared note
  sharedNotes.forEach((note, index) => {
    console.log(`📄 [BACKEND] Note ${index + 1}: "${note.title}" by ${note.author.name}`);
    console.log(`   Shared with ${note.sharedWith.length} users:`);
    note.sharedWith.forEach(share => {
      console.log(`   - ${share.user.email} (${share.user.id})`);
    });
  });
  
  return sharedNotes;
},

    // Get notes from SharedNote collection
    getSharedNotes: async (_, __, { user }) => {
  if (!user) throw new AuthenticationError('Not authenticated');
  
  console.log(`🔍 [BACKEND] Fetching SharedNote docs for user: ${user.email} (${user.id})`);
  
  const sharedNotes = await SharedNote.find({ sharedWith: user.id })
    .populate('note')
    .populate('sharedBy')
    .populate('sharedWith')
    .sort({ sharedAt: -1 });

  console.log(`✅ [BACKEND] Found ${sharedNotes.length} SharedNote documents`);
  
  sharedNotes.forEach((sn, index) => {
    console.log(`📋 [BACKEND] SharedNote ${index + 1}:`);
    console.log(`   Note: "${sn.note?.title}"`);
    console.log(`   Shared by: ${sn.sharedBy?.email}`);
    console.log(`   Shared with: ${sn.sharedWith?.email}`);
    console.log(`   Permission: ${sn.permission}`);
  });
  
  return sharedNotes;
},

    // Existing getAllNotes (if you still need it)
    getAllNotes: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      return await Note.find({
        $or: [
          { author: user.id }, 
          { 'sharedWith.user': user.id }
        ]
      })
      .populate('author')
      .populate('sharedWith.user')
      .sort({ updatedAt: -1 });
    },

    searchNotes: async (_, { query }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const searchRegex = new RegExp(query, 'i');
      
      return await Note.find({
        $and: [
          { 
            $or: [
              { author: user.id }, 
              { 'sharedWith.user': user.id }
            ] 
          },
          {
            $or: [
              { title: searchRegex },
              { content: searchRegex },
              { tags: searchRegex }
            ]
          }
        ]
      })
      .populate('author')
      .populate('sharedWith.user')
      .sort({ updatedAt: -1 });
    },

    searchNotesAdvanced: async (_, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const { query, tags, dateFrom, dateTo, isPublic } = input;
      
      let searchConditions = {
        $or: [
          { author: user.id }, 
          { 'sharedWith.user': user.id }
        ]
      };
      
      // Text search
      if (query) {
        const searchRegex = new RegExp(query, 'i');
        searchConditions.$and = [
          searchConditions,
          {
            $or: [
              { title: searchRegex },
              { content: searchRegex }
            ]
          }
        ];
      }
      
      // Tag filter
      if (tags && tags.length > 0) {
        searchConditions.tags = { $in: tags };
      }
      
      // Date range filter
      if (dateFrom || dateTo) {
        searchConditions.createdAt = {};
        if (dateFrom) searchConditions.createdAt.$gte = new Date(dateFrom);
        if (dateTo) searchConditions.createdAt.$lte = new Date(dateTo);
      }
      
      // Public/private filter
      if (isPublic !== undefined) {
        searchConditions.isPublic = isPublic;
      }
      
      return await Note.find(searchConditions)
        .populate('author')
        .populate('sharedWith.user')
        .sort({ updatedAt: -1 });
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
      )
      .populate('author')
      .populate('sharedWith.user');

      return updatedNote;
    },

    deleteNote: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const note = await Note.findById(id);
      if (!note) {
        throw new UserInputError('Note not found');
      }
      
      if (!note.author.equals(user.id)) {
        throw new AuthenticationError('Not authorized to delete this note');
      }
      
      await Comment.deleteMany({ note: id });
      await Note.findByIdAndDelete(id);
      
      return { 
        success: true,
        message: 'Note deleted successfully' 
      };
    },

    // In backend/schemas/resolvers/noteResolvers.js - shareNote mutation
shareNote: async (_, { noteId, email, permission = 'VIEW' }, { user }) => {
  if (!user) throw new AuthenticationError('Not authenticated');
  
  console.log(`🔗 Sharing note ${noteId} with ${email}, permission: ${permission}`);
  
  try {
    const note = await Note.findById(noteId);
    if (!note) throw new UserInputError('Note not found');
    
    if (!note.author.equals(user.id)) {
      throw new AuthenticationError('Not authorized to share this note');
    }
    
    const userToShare = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToShare) {
      throw new UserInputError('User not found with this email');
    }
    
    if (userToShare._id.equals(user.id)) {
      throw new UserInputError('Cannot share note with yourself');
    }
    
    // Check if already shared
    const alreadyShared = note.sharedWith.some(share => 
      share.user.toString() === userToShare._id.toString()
    );
    
    if (alreadyShared) {
      throw new UserInputError('Note already shared with this user');
    }
    
    const finalPermission = permission || 'VIEW';
    
    // Add to note's sharedWith array
    note.sharedWith.push({
      user: userToShare._id,
      permission: finalPermission,
      sharedAt: new Date()
    });
    
    await note.save();
    
    // Create SharedNote document
    const sharedNote = new SharedNote({
      note: noteId,
      sharedWith: userToShare._id,
      sharedBy: user.id,
      permission: finalPermission,
      sharedAt: new Date()
    });
    
    await sharedNote.save();
    
    // ✅ FIXED: Properly populate and return the SharedNote
    const populatedSharedNote = await SharedNote.findById(sharedNote._id)
      .populate('note')
      .populate('sharedWith')
      .populate('sharedBy');
    
    console.log(`✅ Note shared successfully with ${userToShare.name}`);
    
    // ✅ Ensure all fields are properly set
    return {
      id: populatedSharedNote._id.toString(),
      note: populatedSharedNote.note,
      sharedWith: populatedSharedNote.sharedWith,
      sharedBy: populatedSharedNote.sharedBy,
      permission: populatedSharedNote.permission || 'VIEW', // ✅ Fallback
      sharedAt: populatedSharedNote.sharedAt.toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in shareNote resolver:', error);
    throw error;
  }
}
  },

  Note: {
    comments: async (note) => {
      return await Comment.find({ note: note.id }).populate('author');
    },
  },
};

// ✅ CORRECT: Only export the resolvers object
export { noteResolvers };