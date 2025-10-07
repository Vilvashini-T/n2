import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// HTTP link
const httpLink = createHttpLink({
  uri: 'http://localhost:4001/graphql', // Make sure this matches your backend port
});

// Auth link
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  
  console.log('🔐 Apollo Client - Token being sent:', token ? `${token.substring(0, 20)}...` : 'No token');
  console.log('🔐 Apollo Client - Token length:', token ? token.length : 'No token');
  
  if (!token) {
    console.warn('🚨 No authentication token found!');
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

// Error link - SUPPRESSES Apollo's default error UI
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  // Only log to console, don't trigger Apollo's error UI
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.log(
        `[GraphQL error]: Message: ${message}, Operation: ${operation.operationName}, Path: ${path}`
      );
    });
  }
  
  if (networkError) {
    console.log(`[Network error]: ${networkError.message}`);
  }
  
  // IMPORTANT: Don't throw errors or show UI - let components handle them
});

// Combine all links
const link = from([
  errorLink,      // Handle errors silently first
  authLink,       // Add auth headers
  httpLink        // Make the actual request
]);

// Create client with combined links
const client = new ApolloClient({
  link: link,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'ignore', // Don't throw errors for watchQuery
    },
    query: {
      errorPolicy: 'all', // Return partial results even with errors
    },
    mutate: {
      errorPolicy: 'all', // Return partial results even with errors
    },
  },
});

export default client;