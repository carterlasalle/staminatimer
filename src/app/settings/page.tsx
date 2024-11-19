'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
      }
      setLoading(false)
    }
    getProfile()
  }, [])

  const updateEmail = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
      toast.success('Email update initiated. Please check your inbox.')
    } catch (error) {
      toast.error('Error updating email')
      console.error('Error:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
              <Button onClick={updateEmail}>Update</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 