import { gql } from '@apollo/client';

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const SIGNUP = gql`
  mutation Signup($input: UserInput!) {
    signup(input: $input) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

export const CREATE_NOTE = gql`
  mutation CreateNote($input: NoteInput!) {
    createNote(input: $input) {
      id
      title
      content
      tags
      createdAt
      author {
        id
        name
      }
    }
  }
`;

export const UPDATE_NOTE = gql`
  mutation UpdateNote($id: ID!, $input: NoteInput!) {
    updateNote(id: $id, input: $input) {
      id
      title
      content
      tags
      isPublic
      viewCount
      createdAt
      updatedAt
      author {
        id
        name
      }
    }
  }
`;

export const DELETE_NOTE = gql`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id) {
      success
      message
    }
  }
`;

export const TRANSCRIBE_AUDIO = gql`
  mutation TranscribeAudio($audioData: String!) {
    transcribeAudio(audioData: $audioData) {
      id
      text
      confidence
      isFinal
      createdAt
    }
  }
`;


export const UPDATE_NOTE_PERMISSION = gql`
  mutation UpdateNotePermission($noteId: ID!, $userId: ID!, $permission: String!) {
    updateNotePermission(noteId: $noteId, userId: $userId, permission: $permission) {
      id
      sharedWith {
        user {
          id
          name
        }
        permission
      }
    }
  }
`;

export const REMOVE_NOTE_ACCESS = gql`
  mutation RemoveNoteAccess($noteId: ID!, $userId: ID!) {
    removeNoteAccess(noteId: $noteId, userId: $userId) {
      id
      title
    }
  }
`;

export const UPLOAD_FILE = gql`
  mutation UploadFile($noteId: ID!, $file: Upload!) {
    uploadFile(noteId: $noteId, file: $file) {
      id
      filename
      originalName
      mimetype
      size
      createdAt
      uploadedBy {
        id
        name
      }
    }
  }
`;

export const DELETE_FILE = gql`
  mutation DeleteFile($fileId: ID!) {
    deleteFile(fileId: $fileId)
  }
`;

export const TRANSCRIPTION_SUBSCRIPTION = gql`
  subscription TranscriptionUpdated {
    transcriptionUpdated {
      id
      text
      confidence
      isFinal
      createdAt
    }
  }
`;