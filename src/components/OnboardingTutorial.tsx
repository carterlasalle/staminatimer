'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Timer,
  TrendingUp,
  Bot,
  Dumbbell,
  Brain,
  Target,
  Flame,
  Trophy,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Play,
  Pause,
  BarChart3,
  Zap,
  Heart,
  CheckCircle2
} from 'lucide-react'

const ONBOARDING_KEY = 'stamina-timer-onboarding-completed'

type OnboardingSlide = {
  id: string
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  color: string
  features?: { icon: React.ReactNode; text: string }[]
  demo?: React.ReactNode
}

// Interactive Timer Demo
function TimerDemo() {
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [edges, setEdges] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTime((t) => t + 100)
      }, 100)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running])

  // Cleanup on unmount regardless of running state
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-linear-to-br from-primary/20 to-primary/5 rounded-2xl p-6 border border-primary/20"
    >
      <div className="text-center space-y-4">
        <motion.div
          className="text-4xl font-mono font-bold"
          animate={{ scale: running ? [1, 1.02, 1] : 1 }}
          transition={{ repeat: running ? Infinity : 0, duration: 1 }}
        >
          {formatTime(time)}
        </motion.div>
        <div className="flex justify-center gap-3">
          <Button
            size="sm"
            variant={running ? 'secondary' : 'default'}
            onClick={() => setRunning(!running)}
            className="gap-2"
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? 'Pause' : 'Start'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEdges((e) => e + 1)}
            disabled={!running}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Edge ({edges})
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Try it! Click Start and log edges</p>
      </div>
    </motion.div>
  )
}

// Animated Stats Demo
function StatsDemo() {
  const [animatedStats, setAnimatedStats] = useState({ sessions: 0, streak: 0, level: 0 })

  useEffect(() => {
    const targets = { sessions: 24, streak: 7, level: 5 }
    const duration = 1500
    const steps = 30
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      setAnimatedStats({
        sessions: Math.round(targets.sessions * progress),
        streak: Math.round(targets.streak * progress),
        level: Math.round(targets.level * progress),
      })
      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="grid grid-cols-3 gap-3"
    >
      <motion.div
        className="bg-linear-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 text-center border border-blue-500/20"
        whileHover={{ scale: 1.05 }}
      >
        <BarChart3 className="h-5 w-5 mx-auto mb-2 text-blue-500" />
        <div className="text-2xl font-bold">{animatedStats.sessions}</div>
        <div className="text-xs text-muted-foreground">Sessions</div>
      </motion.div>
      <motion.div
        className="bg-linear-to-br from-orange-500/20 to-orange-500/5 rounded-xl p-4 text-center border border-orange-500/20"
        whileHover={{ scale: 1.05 }}
      >
        <Flame className="h-5 w-5 mx-auto mb-2 text-orange-500" />
        <div className="text-2xl font-bold">{animatedStats.streak}</div>
        <div className="text-xs text-muted-foreground">Day Streak</div>
      </motion.div>
      <motion.div
        className="bg-linear-to-br from-purple-500/20 to-purple-500/5 rounded-xl p-4 text-center border border-purple-500/20"
        whileHover={{ scale: 1.05 }}
      >
        <Trophy className="h-5 w-5 mx-auto mb-2 text-purple-500" />
        <div className="text-2xl font-bold">{animatedStats.level}</div>
        <div className="text-xs text-muted-foreground">Level</div>
      </motion.div>
    </motion.div>
  )
}

// AI Chat Demo
function AIChatDemo() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [typing, setTyping] = useState(false)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    // Reset state on mount
    setMessages([])
    setTyping(false)

    const sequence = [
      { delay: 500, role: 'user' as const, text: 'How can I improve my stamina?' },
      { delay: 1500, role: 'ai' as const, text: 'Great question! Based on your training data, I recommend focusing on breathing techniques and gradually increasing session duration...' },
    ]

    sequence.forEach(({ delay, role, text }) => {
      const timeout = setTimeout(() => {
        if (role === 'ai') {
          setTyping(true)
          const typingTimeout = setTimeout(() => {
            setTyping(false)
            setMessages((m) => [...m, { role, text }])
          }, 800)
          timeoutsRef.current.push(typingTimeout)
        } else {
          setMessages((m) => [...m, { role, text }])
        }
      }, delay)
      timeoutsRef.current.push(timeout)
    })

    // Cleanup all timeouts on unmount
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [])

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-linear-to-br from-green-500/10 to-emerald-500/5 rounded-2xl p-4 border border-green-500/20 space-y-3"
    >
      <AnimatePresence>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {typing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-start"
        >
          <div className="bg-muted px-4 py-2 rounded-xl">
            <motion.div
              className="flex gap-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <div className="w-2 h-2 bg-foreground/50 rounded-full" />
              <div className="w-2 h-2 bg-foreground/50 rounded-full" />
              <div className="w-2 h-2 bg-foreground/50 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Training Methods Demo
function TrainingMethodsDemo() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="grid grid-cols-3 gap-3"
    >
      {[
        { icon: Timer, label: 'Timer', color: 'from-blue-500/20 to-blue-500/5 border-blue-500/20', iconColor: 'text-blue-500' },
        { icon: Dumbbell, label: 'Kegels', color: 'from-orange-500/20 to-orange-500/5 border-orange-500/20', iconColor: 'text-orange-500' },
        { icon: Brain, label: 'Mental', color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20', iconColor: 'text-purple-500' },
      ].map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 + i * 0.1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          className={`bg-linear-to-br ${item.color} rounded-xl p-4 text-center border cursor-pointer`}
        >
          <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.iconColor}`} />
          <div className="text-sm font-medium">{item.label}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}

const slides: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to Stamina Timer',
    subtitle: "Let's get you started",
    description: 'Your personal training companion for building control and improving stamina through structured practice.',
    icon: <Sparkles className="h-12 w-12" />,
    color: 'from-primary/30 to-primary/10',
    features: [
      { icon: <Timer className="h-4 w-4" />, text: 'Precise session timing' },
      { icon: <TrendingUp className="h-4 w-4" />, text: 'Track your progress' },
      { icon: <Bot className="h-4 w-4" />, text: 'AI-powered coaching' },
    ],
  },
  {
    id: 'training',
    title: 'Training Hub',
    subtitle: 'Your practice center',
    description: 'Access all your training tools in one place. Start timed sessions, do kegel exercises, or practice mental techniques.',
    icon: <Timer className="h-12 w-12" />,
    color: 'from-blue-500/30 to-blue-500/10',
    demo: <TrainingMethodsDemo />,
  },
  {
    id: 'timer',
    title: 'Session Timer',
    subtitle: 'Track every moment',
    description: 'Use the precision timer to track your sessions. Log edge events to understand your patterns and build endurance over time.',
    icon: <Zap className="h-12 w-12" />,
    color: 'from-yellow-500/30 to-yellow-500/10',
    demo: <TimerDemo />,
  },
  {
    id: 'exercises',
    title: 'Kegels & Mental Training',
    subtitle: 'Build strength & control',
    description: 'Strengthen your pelvic floor with guided kegel exercises, and develop mental control through breathing and visualization techniques.',
    icon: <Heart className="h-12 w-12" />,
    color: 'from-pink-500/30 to-pink-500/10',
    features: [
      { icon: <Dumbbell className="h-4 w-4" />, text: 'Progressive kegel routines' },
      { icon: <Brain className="h-4 w-4" />, text: 'Breathing exercises' },
      { icon: <Target className="h-4 w-4" />, text: 'Visualization techniques' },
    ],
  },
  {
    id: 'progress',
    title: 'Track Your Progress',
    subtitle: 'See how far you have come',
    description: 'View detailed analytics, set personal goals, and celebrate achievements. Your data helps you understand and improve.',
    icon: <TrendingUp className="h-12 w-12" />,
    color: 'from-green-500/30 to-green-500/10',
    demo: <StatsDemo />,
  },
  {
    id: 'ai-coach',
    title: 'AI Coach',
    subtitle: 'Personalized guidance',
    description: 'Get tailored advice based on your training data. Ask questions, receive tips, and accelerate your progress with AI assistance.',
    icon: <Bot className="h-12 w-12" />,
    color: 'from-emerald-500/30 to-emerald-500/10',
    demo: <AIChatDemo />,
  },
  {
    id: 'ready',
    title: 'You Are All Set!',
    subtitle: 'Start your journey',
    description: 'Everything is ready. Begin your first session and start building the control and stamina you desire.',
    icon: <CheckCircle2 className="h-12 w-12" />,
    color: 'from-primary/30 to-primary/10',
    features: [
      { icon: <Timer className="h-4 w-4" />, text: 'Start your first session' },
      { icon: <Target className="h-4 w-4" />, text: 'Set personal goals' },
      { icon: <Flame className="h-4 w-4" />, text: 'Build your streak' },
    ],
  },
]

type OnboardingTutorialProps = {
  onComplete: () => void
  isOpen: boolean
}

export function OnboardingTutorial({ onComplete, isOpen }: OnboardingTutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(0)

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1)
      setCurrentSlide((s) => s + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1)
      setCurrentSlide((s) => s - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    onComplete()
  }

  const handleSkip = () => {
    handleComplete()
  }

  const progress = ((currentSlide + 1) / slides.length) * 100
  const slide = slides[currentSlide]

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xs p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-lg bg-card rounded-3xl shadow-2xl border overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <span className="font-semibold">Stamina Timer</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSkip} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Step {currentSlide + 1} of {slides.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Content */}
        <div className="relative overflow-hidden" style={{ minHeight: '420px' }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={slide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="p-6 space-y-6"
            >
              {/* Icon with gradient background */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                className={`w-20 h-20 mx-auto rounded-2xl bg-linear-to-br ${slide.color} flex items-center justify-center`}
              >
                <div className="text-foreground">{slide.icon}</div>
              </motion.div>

              {/* Text */}
              <div className="text-center space-y-2">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl font-bold"
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-primary font-medium"
                >
                  {slide.subtitle}
                </motion.p>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {slide.description}
                </motion.p>
              </div>

              {/* Features or Demo */}
              {slide.features && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-3"
                >
                  {slide.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.35 + i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {feature.icon}
                      </div>
                      <span className="text-sm">{feature.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {slide.demo && slide.demo}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <motion.div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                }`}
                animate={{ scale: i === currentSlide ? 1.1 : 1 }}
              />
            ))}
          </div>

          <Button onClick={handleNext} className="gap-2">
            {currentSlide === slides.length - 1 ? (
              <>
                Get Started
                <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      setShowOnboarding(true)
    }
    setHasChecked(true)
  }, [])

  const completeOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem(ONBOARDING_KEY, 'true')
  }

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY)
    setShowOnboarding(true)
  }

  return { showOnboarding, completeOnboarding, resetOnboarding, hasChecked }
}
