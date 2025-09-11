'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase/client'
import { User, Trash2, Lock } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { ResponsiveContainer } from '@/components/ui/responsive-container'

export default function SettingsPage(): JSX.Element {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function getProfile(): Promise<void> {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email);
      }
      setLoading(false)
    }
    getProfile()
  }, [])

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
        toast.error("Email address not found.");
        return;
    }
    try {
      setIsUpdating(true); // Reuse updating state
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`, // Redirect back after reset if needed
      });
      if (error) throw error;
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error) {
      toast.error('Failed to send password reset email.');
      console.error('Password reset error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // TODO: Implement delete account functionality securely on the backend
  const handleDeleteAccount = useCallback(async () => {
      const confirmation = prompt('This action is irreversible. Type your email address to confirm deletion:');
      if (confirmation !== email) {
          toast.warning('Account deletion cancelled or email mismatch.');
          return;
      }

      setIsDeleting(true);
      toast.info('Deleting account...');

      try {
        // IMPORTANT: Implement a Supabase Edge Function (`delete-user`) for secure deletion
        const { error } = await supabase.functions.invoke('delete-user');

        if (error) throw error;

        toast.success('Account deleted successfully. Signing out...');
        await supabase.auth.signOut();
        window.location.href = '/'; // Redirect to home
      } catch (error) {
        toast.error('Failed to delete account.');
        console.error('Delete account error:', error);
        setIsDeleting(false);
      }
      // No finally block needed here as we redirect on success
  }, [email]);

  if (loading) {
    return <Loading text="Loading settings..." fullScreen/>
  }

  return (
    <ResponsiveContainer maxWidth="md" padding className="py-8 md:py-12">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
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
                {isUpdating ? <Loading size="sm" /> : <User />} Update
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Button variant="outline" onClick={handlePasswordReset} disabled={isUpdating}>
               {isUpdating ? <Loading size="sm" /> : <Lock />} Send Password Reset Email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible account actions.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
             {isDeleting ? <Loading size="sm" /> : <Trash2 />} Delete Account
           </Button>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Deleting your account will permanently remove all your session data and achievements.</p>
        </CardFooter>
      </Card>
    </ResponsiveContainer>
  )
}