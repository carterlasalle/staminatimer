'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAICoach } from '@/hooks/useAICoach'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  Send, 
  Brain,
  RefreshCw,
  User,
  Bot,
  Zap,
  TrendingUp,
  Target,
  Activity
} from 'lucide-react'

export function AICoachChat() {
  const { messages, isLoading, sendMessage, clearChat, generateInitialInsights } = useAICoach()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input after sending
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return
    
    sendMessage(inputValue.trim())
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestedQuestions = [
    {
      icon: TrendingUp,
      text: "Analyze my performance patterns and suggest next steps",
    },
    {
      icon: Target,
      text: "What specific goals should I focus on based on my data?",
    },
    {
      icon: Brain,
      text: "Recommend training techniques for my current level",
    },
    {
      icon: Activity,
      text: "How can I improve my consistency and frequency?",
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Chat Messages */}
      <Card className="h-[calc(100vh-12rem)] md:h-[600px] flex flex-col">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg md:text-xl font-medium">AI Performance Coach</h3>
                <p className="text-muted-foreground text-xs md:text-sm max-w-md">
                  Get personalized training insights based on your complete session history
                </p>
              </div>
              
              <Button 
                onClick={generateInitialInsights}
                size="lg"
                disabled={isLoading}
              >
                <Zap className="h-4 w-4 mr-2" />
                Analyze My Performance
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full px-2 md:px-4">
                {suggestedQuestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left h-auto p-2 md:p-3 justify-start whitespace-normal"
                    onClick={() => setInputValue(suggestion.text)}
                  >
                    <suggestion.icon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 flex-shrink-0" />
                    <span className="text-[11px] sm:text-xs md:text-sm leading-tight">{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 mb-8 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-[90%] md:max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">
                    {message.role === 'assistant' ? 'Performance Coach' : 'You'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div
                  className={`rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-lg font-semibold mb-3">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold mb-2 mt-4">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-2 mt-3">{children}</h3>,
                          p: ({children}) => <p className="mb-3 leading-relaxed text-sm">{children}</p>,
                          ul: ({children}) => <ul className="mb-3 ml-4 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="mb-3 ml-4 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                          code: ({children}) => <code className="bg-accent px-1 py-0.5 rounded text-xs">{children}</code>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-primary pl-4 italic">{children}</blockquote>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="hidden sm:flex w-10 h-10 bg-primary rounded-full items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 md:gap-4 mb-8">
              <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="max-w-full sm:max-w-[85%]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Performance Coach</span>
                  <Badge variant="secondary" className="text-xs">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Analyzing...
                  </Badge>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    Processing your training data...
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-3 md:p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your training..."
              className="flex-1 text-sm md:text-base"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {messages.length > 0 && (
            <div className="flex justify-between items-center mt-3">
              <div className="text-xs text-muted-foreground">
                Powered by Gemini 2.5 Pro • {messages.length} messages
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearChat}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}