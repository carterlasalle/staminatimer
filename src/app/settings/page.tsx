'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loading } from '@/components/ui/loading'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase/client'
import { usePreferences } from '@/hooks/usePreferences'
import {
  User,
  Trash2,
  Lock,
  Bell,
  Target,
  RefreshCw,
  Vibrate,
  Volume2,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import { useOnboarding } from '@/components/OnboardingTutorial'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

const NOTIFICATION_PREFS_KEY = 'stamina-notification-prefs'
const APP_PREFS_KEY = 'stamina-app-prefs'

type NotificationPrefs = {
  reminderEnabled: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
}

type AppPrefs = {
  displayName: string
  autoStartTimer: boolean
  showMotivationalMessages: boolean
}

const defaultNotificationPrefs: NotificationPrefs = {
  reminderEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true
}

const defaultAppPrefs: AppPrefs = {
  displayName: '',
  autoStartTimer: false,
  showMotivationalMessages: true
}

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClearingData, setIsClearingData] = useState(false)

  const { prefs: trainingPrefs, setDailyGoalMinutes } = usePreferences()
  const { resetOnboarding } = useOnboarding()

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs)
  const [appPrefs, setAppPrefs] = useState<AppPrefs>(defaultAppPrefs)

  // Load user profile
  useEffect(() => {
    async function getProfile(): Promise<void> {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
        // Use email username as default display name if not set
        const storedAppPrefs = localStorage.getItem(APP_PREFS_KEY)
        if (storedAppPrefs) {
          setAppPrefs(JSON.parse(storedAppPrefs))
        } else {
          setAppPrefs(prev => ({
            ...prev,
            displayName: user.email?.split('@')[0] || ''
          }))
        }
      }
      setLoading(false)
    }

    // Load notification preferences
    try {
      const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY)
      if (stored) {
        setNotificationPrefs(JSON.parse(stored))
      }
    } catch {
      // Use defaults
    }

    getProfile()
  }, [])

  // Save notification preferences
  const updateNotificationPrefs = (updates: Partial<NotificationPrefs>) => {
    const updated = { ...notificationPrefs, ...updates }
    setNotificationPrefs(updated)
    try {
      localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated))
      toast.success('Preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    }
  }

  // Save app preferences
  const updateAppPrefs = (updates: Partial<AppPrefs>) => {
    const updated = { ...appPrefs, ...updates }
    setAppPrefs(updated)
    try {
      localStorage.setItem(APP_PREFS_KEY, JSON.stringify(updated))
      toast.success('Preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    }
  }

  const updateEmail = async (): Promise<void> => {
    try {
      setIsUpdating(true)
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
      toast.success('Email update initiated. Please check your inbox.')
    } catch (error) {
      toast.error('Error updating email')
      console.error('Error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePasswordReset = async (): Promise<void> => {
    if (!email) {
      toast.error("Email address not found.")
      return
    }
    try {
      setIsUpdating(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
      toast.success('Password reset email sent. Please check your inbox.')
    } catch (error) {
      toast.error('Failed to send password reset email.')
      console.error('Password reset error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearLocalData = useCallback(async () => {
    const confirm = window.confirm('This will clear all locally stored preferences and cached data. Your cloud data will remain. Continue?')
    if (!confirm) return

    setIsClearingData(true)
    try {
      // Clear all stamina-related localStorage items
      const keysToRemove = Object.keys(localStorage).filter(key =>
        key.startsWith('stamina') || key.startsWith('pwa-')
      )
      keysToRemove.forEach(key => localStorage.removeItem(key))

      toast.success('Local data cleared. Page will reload.')
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      toast.error('Failed to clear local data')
      console.error('Clear data error:', error)
      setIsClearingData(false)
    }
  }, [])

  const handleDeleteAccount = useCallback(async () => {
    const confirmation = prompt('This action is irreversible. Type your email address to confirm deletion:')
    if (confirmation !== email) {
      toast.warning('Account deletion cancelled or email mismatch.')
      return
    }

    setIsDeleting(true)
    toast.info('Deleting account...')

    try {
      const { error } = await supabase.functions.invoke('delete-user')
      if (error) throw error

      toast.success('Account deleted successfully. Signing out...')
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      toast.error('Failed to delete account. Please contact support.')
      console.error('Delete account error:', error)
      setIsDeleting(false)
    }
  }, [email])

  if (loading) {
    return <Loading text="Loading settings..." fullScreen />
  }

  return (
    <AppNavigation>
      <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-medium">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and app preferences
          </p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={appPrefs.displayName}
                onChange={(e) => setAppPrefs(prev => ({ ...prev, displayName: e.target.value }))}
                onBlur={() => updateAppPrefs({ displayName: appPrefs.displayName })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  disabled={isUpdating}
                />
                <Button onClick={updateEmail} disabled={isUpdating}>
                  {isUpdating ? <Loading size="sm" /> : 'Update'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Training Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Training Preferences
            </CardTitle>
            <CardDescription>Customize your training experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Daily Goal</Label>
                <span className="text-sm text-muted-foreground">{trainingPrefs.dailyGoalMinutes} minutes</span>
              </div>
              <Slider
                value={[trainingPrefs.dailyGoalMinutes]}
                onValueChange={([value]) => setDailyGoalMinutes(value)}
                min={5}
                max={60}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Set your daily training goal in minutes
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-start Timer</Label>
                <p className="text-xs text-muted-foreground">
                  Start timer automatically when entering training
                </p>
              </div>
              <Switch
                checked={appPrefs.autoStartTimer}
                onCheckedChange={(checked) => updateAppPrefs({ autoStartTimer: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Motivational Messages</Label>
                <p className="text-xs text-muted-foreground">
                  Show encouraging messages during training
                </p>
              </div>
              <Switch
                checked={appPrefs.showMotivationalMessages}
                onCheckedChange={(checked) => updateAppPrefs({ showMotivationalMessages: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label>Training Reminders</Label>
                  <p className="text-xs text-muted-foreground">
                    Get reminded to train
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationPrefs.reminderEnabled}
                onCheckedChange={(checked) => updateNotificationPrefs({ reminderEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label>Sound Effects</Label>
                  <p className="text-xs text-muted-foreground">
                    Play sounds during training
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationPrefs.soundEnabled}
                onCheckedChange={(checked) => updateNotificationPrefs({ soundEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label>Vibration</Label>
                  <p className="text-xs text-muted-foreground">
                    Vibrate on important events
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationPrefs.vibrationEnabled}
                onCheckedChange={(checked) => updateNotificationPrefs({ vibrationEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Password and security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handlePasswordReset} disabled={isUpdating}>
              {isUpdating ? <Loading size="sm" className="mr-2" /> : <Lock className="mr-2 h-4 w-4" />}
              Send Password Reset Email
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Manage your local data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleClearLocalData} disabled={isClearingData}>
              {isClearingData ? <Loading size="sm" className="mr-2" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Clear Local Data
            </Button>
            <p className="text-xs text-muted-foreground">
              Clear cached data and preferences stored in your browser
            </p>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </CardTitle>
            <CardDescription>Get help and learn how to use the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={resetOnboarding}>
              <Sparkles className="mr-2 h-4 w-4" />
              Replay Tutorial
            </Button>
            <p className="text-xs text-muted-foreground">
              Watch the app introduction again to learn about all features
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? <Loading size="sm" className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Account
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Deleting your account will permanently remove all your session data and achievements.
            </p>
          </CardFooter>
        </Card>
      </div>
    </AppNavigation>
  )
}
