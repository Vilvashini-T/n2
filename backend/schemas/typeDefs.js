// backend/schemas/typeDefs.js
import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    theme: String!
    createdAt: String!
    updatedAt: String!
  }

  type Note {
    id: ID!
    title: String!
    content: String!
    author: User!
    tags: [String!]
    isPublic: Boolean!
    sharedWith: [User!]
    comments: [Comment!]
    viewCount: Int!
    createdAt: String!
    updatedAt: String!
    lastEditedAt: String!
  }

  type Comment {
    id: ID!
    text: String!
    author: User!
    note: Note!
    createdAt: String!
    updatedAt: String!
  }

  type Analytics {
    totalNotes: Int!
    totalComments: Int!
    notesCreatedThisWeek: Int!
    mostActiveNote: Note
    weeklyActivity: [DailyActivity!]!
  }

  type DailyActivity {
    date: String!
    notesCreated: Int!
    commentsAdded: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input NoteInput {
    title: String!
    content: String!
    tags: [String!]
    isPublic: Boolean
  }

  input UserInput {
    name: String!
    email: String!
    password: String!
  }

  input CommentInput {
    text: String!
    noteId: ID!
  }

  type Query {
    # User queries
    me: User
    getUser(id: ID!): User
    
    # Note queries
    getAllNotes: [Note!]!
    getNote(id: ID!): Note
    getNotesByTag(tag: String!): [Note!]!
    searchNotes(query: String!): [Note!]!
    getSharedNotes: [Note!]!
    
    # Analytics
    getAnalytics: Analytics!
  }

  type Mutation {
    # Authentication
    signup(input: UserInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    # Notes
    createNote(input: NoteInput!): Note!
    updateNote(id: ID!, input: NoteInput!): Note!
    deleteNote(id: ID!): DeleteResponse
    shareNote(noteId: ID!, userId: ID!): Note!
    
    # Comments
    addComment(input: CommentInput!): Comment!
    updateComment(id: ID!, text: String!): Comment!
    deleteComment(id: ID!): Boolean!
  }
   
type DeleteResponse {
  success: Boolean!
  message: String!
}

  type Subscription {
    commentAdded(noteId: ID!): Comment!
    noteUpdated(noteId: ID!): Note!
  }
`;

export default typeDefs;