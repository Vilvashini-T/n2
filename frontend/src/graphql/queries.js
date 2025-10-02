import { gql } from '@apollo/client';

export const GET_ALL_NOTES = gql`
  query GetAllNotes {
    getAllNotes {
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
        email
      }
    }
  }
`;