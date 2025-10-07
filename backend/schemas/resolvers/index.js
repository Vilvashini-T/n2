// backend/schemas/resolvers/index.js
import { userResolvers } from './userResolvers.js';
import { noteResolvers } from './noteResolvers.js';
import { commentResolvers } from './commentResolvers.js';
import { analyticsResolvers } from './analyticsResolvers.js';
import { sttResolvers } from './sttResolvers.js';

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...noteResolvers.Query,
    ...analyticsResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...noteResolvers.Mutation,
    ...commentResolvers.Mutation,
    ...sttResolvers.Mutation,
  },
  User: userResolvers.User || {},
  Note: noteResolvers.Note || {},
  Comment: commentResolvers.Comment || {},
};

export default resolvers;