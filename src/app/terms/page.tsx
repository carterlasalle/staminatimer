import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
          <CardTitle className="text-2xl">Terms of Service</CardTitle>
          <p className="text-sm text-muted-foreground">Effective Date: January 20, 2025</p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Welcome to Stamina Timer. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Stamina Timer
            application and website (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to be
            bound by these Terms. If you do not agree to these Terms, do not use the Service.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be at least 18 years of age to use the Service. By using the Service, you represent and warrant that
            you are 18 years of age or older. The Service is intended for adults only and contains content related to
            adult performance training.
          </p>

          <h2>2. Description of Service</h2>
          <p>Stamina Timer provides:</p>
          <ul>
            <li>Performance timing and tracking tools</li>
            <li>Session history and analytics</li>
            <li>Progress visualization and statistics</li>
            <li>Achievement and gamification features</li>
            <li>AI-powered coaching assistance</li>
            <li>Data export and sharing capabilities</li>
          </ul>
          <p>
            The Service is provided for personal, non-commercial use only. We reserve the right to modify, suspend,
            or discontinue any aspect of the Service at any time without prior notice.
          </p>

          <h2>3. Account Registration</h2>
          <p>To access certain features, you must create an account. You agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and update your information to keep it accurate</li>
            <li>Keep your login credentials secure and confidential</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized access or security breach</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent,
            abusive, or illegal activity.
          </p>

          <h2>4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
            <li>Attempt to gain unauthorized access to the Service, other accounts, or computer systems</li>
            <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
            <li>Use automated scripts, bots, or other means to access or scrape the Service</li>
            <li>Circumvent, disable, or interfere with security features of the Service</li>
            <li>Impersonate any person or entity or misrepresent your affiliation</li>
            <li>Upload or transmit viruses, malware, or other malicious code</li>
            <li>Attempt to manipulate or falsify session data or achievements</li>
            <li>Use the AI coaching feature to generate harmful, illegal, or inappropriate content</li>
            <li>Share your account credentials with others</li>
          </ul>

          <h2>5. AI Coaching Feature</h2>
          <p>The Service includes an AI-powered coaching feature. By using this feature, you acknowledge that:</p>
          <ul>
            <li>AI responses are generated automatically and may not always be accurate or appropriate</li>
            <li>The AI is not a substitute for professional medical, psychological, or health advice</li>
            <li>You should not rely solely on AI guidance for health-related decisions</li>
            <li>AI interactions are subject to rate limiting to ensure fair usage</li>
            <li>We may review AI interactions to improve the Service and ensure compliance with these Terms</li>
            <li>Abuse of the AI feature, including prompt injection attempts, may result in account suspension</li>
          </ul>

          <h2>6. Health Disclaimer</h2>
          <p className="font-semibold">
            THE SERVICE IS NOT A MEDICAL DEVICE AND IS NOT INTENDED TO DIAGNOSE, TREAT, CURE, OR PREVENT ANY DISEASE
            OR HEALTH CONDITION.
          </p>
          <ul>
            <li>Consult a healthcare provider before starting any training program</li>
            <li>The Service provides general information for educational purposes only</li>
            <li>Individual results may vary and are not guaranteed</li>
            <li>Stop using the Service immediately if you experience any adverse effects</li>
            <li>We are not responsible for any health outcomes resulting from use of the Service</li>
          </ul>

          <h2>7. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by Carter LaSalle and are
            protected by copyright, trademark, and other intellectual property laws. The source code is available
            under the MIT License as described on our <Link href="/license" className="text-primary hover:underline">License page</Link>.
          </p>
          <p>
            You retain ownership of any data you input into the Service. By using the Service, you grant us a
            limited license to process and store your data as necessary to provide the Service.
          </p>

          <h2>8. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>,
            which describes how we collect, use, and protect your personal information. By using the Service, you
            consent to the collection and use of your data as described in the Privacy Policy.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>We do not warrant that:</p>
          <ul>
            <li>The Service will be uninterrupted, secure, or error-free</li>
            <li>Results obtained from the Service will be accurate or reliable</li>
            <li>Any defects in the Service will be corrected</li>
            <li>The Service will meet your specific requirements or expectations</li>
          </ul>

          <h2>10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL STAMINA TIMER, ITS OWNER, AFFILIATES, OR
            LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
            BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF
            THE SERVICE.
          </p>
          <p>
            OUR TOTAL LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US,
            IF ANY, IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
          </p>

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Stamina Timer and its owner from and against any
            claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of
            or related to your use of the Service, your violation of these Terms, or your violation of any rights
            of another.
          </p>

          <h2>12. Third-Party Services</h2>
          <p>
            The Service may integrate with or contain links to third-party services, including but not limited to:
          </p>
          <ul>
            <li>Authentication providers (Google, GitHub)</li>
            <li>Cloud infrastructure (Supabase, Vercel)</li>
            <li>AI services (Google Gemini)</li>
          </ul>
          <p>
            We are not responsible for the practices or content of third-party services. Your use of such services
            is subject to their respective terms and privacy policies.
          </p>

          <h2>13. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Service immediately, without prior notice,
            for any reason, including if you breach these Terms. Upon termination, your right to use the Service
            will cease immediately.
          </p>
          <p>
            You may terminate your account at any time by contacting us or using the account deletion feature
            in Settings. Upon termination, your data will be handled as described in our Privacy Policy.
          </p>

          <h2>14. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of material changes by
            posting the updated Terms on the Service with a new effective date. Your continued use of the Service
            after such changes constitutes your acceptance of the new Terms.
          </p>

          <h2>15. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the United States,
            without regard to its conflict of law provisions. Any disputes arising under these Terms shall be
            resolved through binding arbitration in accordance with applicable arbitration rules.
          </p>

          <h2>16. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
            limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in
            full force and effect.
          </p>

          <h2>17. Entire Agreement</h2>
          <p>
            These Terms, together with the Privacy Policy and License, constitute the entire agreement between
            you and Stamina Timer regarding the Service and supersede all prior agreements and understandings.
          </p>

          <h2>18. Contact Information</h2>
          <p>For questions about these Terms, please contact:</p>
          <ul>
            <li>Email: carterlasalle@gmail.com</li>
            <li>GitHub: <a href="https://github.com/carterlasalle/staminatimer" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">github.com/carterlasalle/staminatimer</a></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
