import { gql } from '@apollo/client';

export const DELETE_NOTE = gql`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id) {
      success
      message
    }
  }
`;

export const GET_ALL_NOTES = gql`
  query GetAllNotes {
    getAllNotes {
      id
      title
      content
      isPublic
      viewCount
      createdAt
      updatedAt
      author {
        id
        username
      }
      sharedWith {
        id
        username
      }
    }
  }
`;
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