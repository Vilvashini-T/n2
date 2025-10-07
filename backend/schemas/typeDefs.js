import { gql } from 'apollo-server-express';

const typeDefs = gql`
  input UpdateProfileInput {
    name: String
    theme: String
  }

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
    sharedWith: [SharedWithInfo!]
    comments: [Comment!]
    viewCount: Int!
    createdAt: String!
    updatedAt: String!
    lastEditedAt: String!
  }

  type SharedWithInfo {
    user: User!
    permission: String!
    sharedAt: String!
  }

  type SharedNote {
  id: ID!
  note: Note!
  sharedWith: User!
  sharedBy: User!
  permission: String!
  sharedAt: String!
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

  # ADD STT TYPE
  type Transcription {
    id: ID!
    text: String!
    confidence: Float
    isFinal: Boolean!
    createdAt: String!
  }

  # ADD SEARCH INPUT TYPE:
  input SearchInput {
    query: String
    tags: [String!]
    dateFrom: String
    dateTo: String
    isPublic: Boolean
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
    getMyNotes: [Note!]!                    # ✅ ADD THIS
    getSharedWithMe: [Note!]!               # ✅ ADD THIS
    getSharedNotes: [SharedNote!]!          # ✅ Keep only ONE of these
    
    # Search queries
    searchNotes(query: String!): [Note!]!
    searchNotesAdvanced(input: SearchInput!): [Note!]!
    
    # Analytics
    getAnalytics: Analytics!
}

  type Mutation {
    # Authentication
    signup(input: UserInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    # ADD THIS LINE - Update Profile
    updateProfile(input: UpdateProfileInput!): User!
    
    # Notes
    createNote(input: NoteInput!): Note!
    updateNote(id: ID!, input: NoteInput!): Note!
    deleteNote(id: ID!): DeleteResponse
    shareNote(noteId: ID!, email: String!, permission: String!): SharedNote!
    
    # Comments
    addComment(input: CommentInput!): Comment!
    updateComment(id: ID!, text: String!): Comment!
    deleteComment(id: ID!): Boolean!

    # ADD STT MUTATION
    transcribeAudio(audioData: String!): Transcription!
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