'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAICoach } from '@/hooks/useAICoach'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEffect, useRef, useState } from 'react'

const SUGGESTIONS = [
  'What pattern do you see in my recent sessions?',
  'How should I approach my current target?',
  'What can make my training more consistent?',
]

/** The existing coach endpoint in a calm journal surface, without chat product theatre. */
export function AICoachChat() {
  const { messages, isLoading, sendMessage, clearChat, generateInitialInsights } = useAICoach()
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus()
  }, [isLoading])

  const submit = () => {
    const question = inputValue.trim()
    if (!question || isLoading) return
    sendMessage(question)
    setInputValue('')
  }

  return (
    <div className="mx-auto max-w-5xl pb-12 pt-8 md:pt-12">
      <header className="border-b border-border/60 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
          Training journal
        </p>
        <h1 className="mt-4 font-display text-5xl tracking-[-0.06em] sm:text-6xl">Coach</h1>
      </header>

      <section className="grid gap-10 py-10 lg:grid-cols-[1.2fr_.8fr] lg:gap-16">
        <div>
          <p className="text-sm text-muted-foreground">Latest insight</p>
          {latestAssistantMessage ? (
            <article className="coach-reading mt-4 border-l border-primary pl-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {latestAssistantMessage.content}
              </ReactMarkdown>
            </article>
          ) : (
            <div className="mt-4 border-l border-primary pl-5">
              <h2 className="font-display text-3xl tracking-[-0.045em]">
                Start with your own data.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Ask for an initial read of your session history. The response will stay focused on
                the records in your account.
              </p>
              <Button className="mt-6" onClick={generateInitialInsights} disabled={isLoading}>
                Read my training <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <aside className="border-t border-border/60 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-sm text-muted-foreground">Ask about your training</p>
          <div className="mt-4 divide-y divide-border/60 border-y border-border/60">
            {SUGGESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm transition-colors hover:text-primary"
                onClick={() => setInputValue(question)}
              >
                <span>{question}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            ))}
          </div>
        </aside>
      </section>

      {messages.length > 0 && (
        <section aria-label="Earlier notes" className="border-t border-border/60 pt-8">
          <div className="space-y-8">
            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === 'user'
                    ? 'max-w-2xl text-sm text-muted-foreground'
                    : 'coach-reading max-w-3xl'
                }
              >
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {message.role === 'user' ? 'Question' : 'Coach note'}
                </p>
                {message.role === 'user' ? (
                  <p>{message.content}</p>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 border-t border-border/60 pt-6">
        <label className="sr-only" htmlFor="coach-question">
          Ask about your training
        </label>
        <div className="flex gap-2">
          <Input
            id="coach-question"
            ref={inputRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
            placeholder="Ask about your training…"
            disabled={isLoading}
          />
          <Button
            onClick={submit}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send question"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isLoading ? 'Reading your training data…' : 'Responses use your session history.'}
          </span>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" className="h-auto px-0 text-xs" onClick={clearChat}>
              <RefreshCw className="mr-1 h-3 w-3" />
              Clear notes
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
