import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

if (!API_KEY) {
  throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable')
}

const genAI = new GoogleGenerativeAI(API_KEY)

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    console.error('Error generating AI response:', error)
    
    // Handle specific API errors
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      throw new Error('API rate limit exceeded. Please try again in a few moments. The free tier has limited requests per minute.')
    }
    
    if (error?.message?.includes('401') || error?.message?.includes('API key')) {
      throw new Error('API authentication failed. Please check your API key configuration.')
    }
    
    if (error?.message?.includes('403')) {
      throw new Error('API access denied. Please verify your API key has the necessary permissions.')
    }
    
    throw new Error('Unable to generate AI response. Please try again later.')
  }
}

export async function generateStreamResponse(prompt: string) {
  try {
    const result = await geminiModel.generateContentStream(prompt)
    return result
  } catch (error) {
    console.error('Error generating AI stream response:', error)
    throw new Error('Failed to generate AI stream response')
  }
}