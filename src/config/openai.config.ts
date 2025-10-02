// OpenAI configuration
// In production, these should be set as environment variables
// For Azure Static Web Apps, you'll need to add them as GitHub secrets

export const getOpenAIConfig = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const assistantKey = import.meta.env.VITE_OPENAI_API_KEY_ASSISTANT;
  
  if (!apiKey && import.meta.env.PROD) {
    console.warn('OpenAI API key not configured. Some features may not work.');
  }
  
  return {
    apiKey: apiKey || '',
    assistantKey: assistantKey || apiKey || '',
    isConfigured: !!apiKey
  };
};