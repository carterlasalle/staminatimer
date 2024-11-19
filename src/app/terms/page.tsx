import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Last updated: November 19, 2024</p>

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using Stamina Timer ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.</p>

          <h2>2. Description of Service</h2>
          <p>Stamina Timer is a training and performance tracking application that provides:</p>
          <ul>
            <li>Timer functionality</li>
            <li>Progress tracking</li>
            <li>Performance analytics</li>
            <li>Data visualization</li>
            <li>User accounts and profiles</li>
          </ul>

          <h2>3. User Accounts</h2>
          <h3>3.1 Registration</h3>
          <ul>
            <li>You must register for an account to use the Service</li>
            <li>You must provide accurate and complete information</li>
            <li>You are responsible for maintaining account security</li>
            <li>You must be 18 years or older to use the Service</li>
          </ul>

          <h3>3.2 Account Security</h3>
          <ul>
            <li>Keep your password secure</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>You are responsible for all activities under your account</li>
            <li>One person per account</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Share content that is illegal, harmful, or offensive</li>
            <li>Impersonate others or misrepresent your affiliation</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Use the Service for commercial purposes without permission</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Automate access to the Service without permission</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <h3>5.1 Our Rights</h3>
          <ul>
            <li>The Service and its content are owned by Stamina Timer</li>
            <li>All trademarks, logos, and service marks are our property</li>
            <li>The software is protected by copyright laws</li>
          </ul>

          <h3>5.2 Your Rights</h3>
          <ul>
            <li>You retain rights to your personal data</li>
            <li>You grant us license to use your data to provide the Service</li>
            <li>You may export your data at any time</li>
          </ul>

          <h2>6. Payment Terms</h2>
          <h3>6.1 Free Service</h3>
          <ul>
            <li>Basic features are currently free</li>
            <li>We may introduce paid features in the future</li>
          </ul>

          <h3>6.2 Future Pricing</h3>
          <ul>
            <li>Changes to pricing will be communicated in advance</li>
            <li>You will have the option to accept or decline paid features</li>
          </ul>

          <h2>7. Termination</h2>
          <p>We may terminate or suspend your account if you:</p>
          <ul>
            <li>Violate these Terms</li>
            <li>Engage in harmful behavior</li>
            <li>Abuse the Service</li>
            <li>Upon your request</li>
          </ul>

          <h2>8. Disclaimers</h2>
          <h3>8.1 Service Availability</h3>
          <ul>
            <li>The Service is provided "as is"</li>
            <li>We do not guarantee uninterrupted service</li>
            <li>We may modify or discontinue features</li>
          </ul>

          <h3>8.2 Health and Safety</h3>
          <ul>
            <li>Consult healthcare providers before starting any training program</li>
            <li>We are not responsible for any health-related outcomes</li>
            <li>Use the Service at your own risk</li>
          </ul>

          <h2>9. Limitation of Liability</h2>
          <p>We are not liable for:</p>
          <ul>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of data or profits</li>
            <li>Service interruptions</li>
            <li>Third-party actions</li>
          </ul>

          <h2>10. Indemnification</h2>
          <p>You agree to indemnify and hold us harmless from claims arising from:</p>
          <ul>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another</li>
          </ul>

          <h2>11. Changes to Terms</h2>
          <p>We may modify these Terms:</p>
          <ul>
            <li>With notice via email or Service announcement</li>
            <li>Continued use constitutes acceptance of changes</li>
            <li>You may terminate your account if you disagree</li>
          </ul>

          <h2>12. Governing Law</h2>
          <p>These Terms are governed by:</p>
          <ul>
            <li>Laws of [Jurisdiction]</li>
            <li>Without regard to conflict of law principles</li>
            <li>Exclusive jurisdiction of courts in [Jurisdiction]</li>
          </ul>

          <h2>13. Severability</h2>
          <p>If any provision is found unenforceable:</p>
          <ul>
            <li>The provision will be modified minimally to be enforceable</li>
            <li>Remaining provisions remain in full effect</li>
          </ul>

          <h2>14. Entire Agreement</h2>
          <p>These Terms constitute:</p>
          <ul>
            <li>The entire agreement between you and us</li>
            <li>Supersede all prior agreements</li>
            <li>Cannot be modified except in writing</li>
          </ul>

          <h2>15. Contact Information</h2>
          <p>For questions about these Terms:</p>
          <ul>
            <li>Email: carterlasalle@gmail.com</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 