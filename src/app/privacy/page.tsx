import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Link href="/">
        <Button variant="ghost" className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Last updated: November 19, 2024</p>

          <h2>1. Introduction</h2>
          <p>Welcome to Stamina Timer. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our service.</p>

          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <ul>
            <li>Email address (when you create an account)</li>
            <li>Authentication information</li>
            <li>User preferences and settings</li>
          </ul>

          <h3>2.2 Usage Data</h3>
          <ul>
            <li>Training session data</li>
            <li>Performance metrics</li>
            <li>Analytics data</li>
            <li>Device information</li>
            <li>Browser type and version</li>
            <li>Time zone setting and location</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our service</li>
            <li>Track your progress and generate analytics</li>
            <li>Improve our service</li>
            <li>Send you updates and notifications (with your consent)</li>
            <li>Detect and prevent technical issues</li>
          </ul>

          <h2>4. Data Storage and Security</h2>
          <ul>
            <li>All data is stored securely on Supabase's infrastructure</li>
            <li>We implement appropriate technical and organizational security measures</li>
            <li>Data is encrypted in transit and at rest</li>
            <li>Personal data is isolated and protected through role-based access control</li>
          </ul>

          <h2>5. Data Sharing and Third Parties</h2>
          <p>We do not sell your personal data. We share data with:</p>
          <ul>
            <li>Supabase (our database provider)</li>
            <li>Authentication service providers</li>
            <li>Analytics providers (in anonymized form)</li>
          </ul>

          <h2>6. User Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Withdraw consent for data processing</li>
            <li>File a complaint with supervisory authorities</li>
          </ul>

          <h2>7. Data Retention</h2>
          <p>We retain your data for:</p>
          <ul>
            <li>Active accounts: As long as the account is active</li>
            <li>Deleted accounts: Up to 30 days after deletion</li>
            <li>Anonymous analytics: Up to 24 months</li>
          </ul>

          <h2>8. Children's Privacy</h2>
          <p>Our service is not intended for users under 18 years of age. We do not knowingly collect data from users under 18.</p>

          <h2>9. Cookies and Tracking</h2>
          <p>We use:</p>
          <ul>
            <li>Essential cookies for authentication</li>
            <li>Analytics cookies (with consent)</li>
            <li>Local storage for app functionality</li>
          </ul>

          <h2>10. International Data Transfers</h2>
          <p>Your data may be processed in countries outside your residence. We ensure appropriate safeguards are in place for international transfers.</p>

          <h2>11. Changes to This Policy</h2>
          <p>We may update this policy periodically. We will notify you of any significant changes through:</p>
          <ul>
            <li>Email notification</li>
            <li>Service announcement</li>
            <li>Website notice</li>
          </ul>

          <h2>12. Contact Information</h2>
          <p>For privacy-related inquiries:</p>
          <ul>
            <li>Email: carterlasalle@gmail.com</li>
          </ul>

          <h2>13. Legal Basis for Processing</h2>
          <p>We process data based on:</p>
          <ul>
            <li>Contract fulfillment</li>
            <li>Legal obligations</li>
            <li>Legitimate interests</li>
            <li>User consent</li>
          </ul>

          <h2>14. Data Protection Rights</h2>
          <p>Under GDPR and similar regulations, you have rights including:</p>
          <ul>
            <li>Right to access</li>
            <li>Right to rectification</li>
            <li>Right to erasure</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object</li>
            <li>Rights regarding automated decision-making</li>
          </ul>

          <h2>15. Third-Party Links</h2>
          <p>Our service may contain links to third-party websites. We are not responsible for their privacy practices.</p>
        </CardContent>
      </Card>
    </div>
  )
} 