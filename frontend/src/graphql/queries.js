import { gql } from '@apollo/client';

// Query to get notes created by the current user
export const GET_MY_NOTES = gql`
  query GetMyNotes {
    getMyNotes {
      id
      title
      content
      tags
      isPublic
      viewCount
      createdAt
      author {
        id
        name
        email
      }
      sharedWith {
        user {
          id
          name
          email
        }
        permission
        sharedAt
      }
    }
  }
`;

// Query to get notes shared with the current user
export const GET_SHARED_NOTES = gql`
  query GetSharedNotes {
    getSharedNotes {
      id
      note {
        id
        title
        content
        tags
        isPublic
        viewCount
        createdAt
        author {
          id
          name
          email
        }
      }
      sharedWith {
        id
        name
        email
      }
      sharedBy {
        id
        name
        email
      }
      permission
      sharedAt
    }
  }
`;

// Query to get note sharing information
export const GET_NOTE_SHARING_INFO = gql`
  query GetNoteSharingInfo($noteId: ID!) {
    getNoteSharingInfo(noteId: $noteId) {
      id
      sharedWith {
        user {
          id
          name
          email
        }
        permission
        sharedAt
      }
    }
  }
`;

// Basic search query
export const SEARCH_NOTES = gql`
  query SearchNotes($query: String!) {
    searchNotes(query: $query) {
      id
      title
      content
      tags
      isPublic
      viewCount
      createdAt
      author {
        id
        name
        email
      }
      sharedWith {
        user {
          id
          name
          email
        }
        permission
      }
    }
  }
`;

// Advanced search query
export const SEARCH_NOTES_ADVANCED = gql`
  query SearchNotesAdvanced($input: SearchInput!) {
    searchNotesAdvanced(input: $input) {
      id
      title
      content
      tags
      isPublic
      viewCount
      createdAt
      author {
        id
        name
        email
      }
      sharedWith {
        user {
          id
          name
          email
        }
        permission
      }
    }
  }
`;

// Query to get files by note
export const GET_FILES_BY_NOTE = gql`
  query GetFilesByNote($noteId: ID!) {
    getFilesByNote(noteId: $noteId) {
      id
      filename
      originalName
      mimetype
      size
      url
      uploadedAt
      uploadedBy {
        id
        name
      }
    }
  }
`;