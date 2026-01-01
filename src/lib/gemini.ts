import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

let genAI: GoogleGenerativeAI | null = null
let geminiModelInstance: GenerativeModel | null = null

function getGeminiModel(): GenerativeModel {
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!API_KEY) {
    throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable')
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY)
  }

  if (!geminiModelInstance) {
    geminiModelInstance = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  }

  return geminiModelInstance
}

export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error: unknown) {
    console.error('Error generating AI response:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    // Handle specific API errors
    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      throw new Error('API rate limit exceeded. Please try again in a few moments. The free tier has limited requests per minute.')
    }

    if (errorMessage.includes('401') || errorMessage.includes('API key')) {
      throw new Error('API authentication failed. Please check your API key configuration.')
    }

    if (errorMessage.includes('403')) {
      throw new Error('API access denied. Please verify your API key has the necessary permissions.')
    }

    if (errorMessage.includes('Missing NEXT_PUBLIC_GEMINI_API_KEY')) {
      throw error
    }

    throw new Error('Unable to generate AI response. Please try again later.')
  }
}

export async function generateStreamResponse(prompt: string) {
  try {
    const model = getGeminiModel()
    const result = await model.generateContentStream(prompt)
    return result
  } catch (error) {
    console.error('Error generating AI stream response:', error)
    throw new Error('Failed to generate AI stream response')
  }
}