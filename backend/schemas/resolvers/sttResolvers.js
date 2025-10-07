import { AuthenticationError } from 'apollo-server-express';

// Mock transcription service
const mockTranscribe = async (audioData) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock transcription
  const mockTexts = [
    "This is a sample transcription of your speech.",
    "Hello, welcome to the notes app with voice features!",
    "Create a new note about important meeting topics.",
    "Remember to buy groceries and finish the project.",
    "The weather is nice today for outdoor activities."
  ];
  
  const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
  
  return {
    id: Date.now().toString(),
    text: randomText,
    confidence: Math.random() * 0.5 + 0.5,
    isFinal: true,
    createdAt: new Date().toISOString()
  };
};

export const sttResolvers = {
  Mutation: {
    transcribeAudio: async (_, { audioData }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      console.log('🎤 Transcribing audio data...');
      
      try {
        const transcription = await mockTranscribe(audioData);
        console.log('✅ Transcription completed:', transcription.text.substring(0, 50) + '...');
        return transcription;
      } catch (error) {
        console.error('❌ Transcription error:', error);
        throw new Error('Transcription failed: ' + error.message);
      }
    }
  }
};