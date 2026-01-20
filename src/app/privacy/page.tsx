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
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Effective Date: January 20, 2025</p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Welcome to Stamina Timer. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you use our application and website (the &quot;Service&quot;). Please read this policy
            carefully. By using the Service, you consent to the practices described in this Privacy Policy.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>1.1 Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Email address</li>
            <li>Name (if provided through OAuth)</li>
            <li>Profile picture (if provided through OAuth)</li>
            <li>Authentication provider information (Google, GitHub)</li>
          </ul>

          <h3>1.2 Training Data</h3>
          <p>When you use the Service, we collect:</p>
          <ul>
            <li>Session timing data (start time, end time, duration)</li>
            <li>Performance metrics (active duration, edge duration)</li>
            <li>Session outcomes and completion status</li>
            <li>Achievement progress and unlocked achievements</li>
          </ul>

          <h3>1.3 AI Coaching Data</h3>
          <p>When you use the AI coaching feature, we collect:</p>
          <ul>
            <li>Your questions and prompts to the AI</li>
            <li>AI-generated responses</li>
            <li>Interaction timestamps and frequency</li>
          </ul>
          <p>
            AI prompts are processed through Google Gemini. Your prompts are sanitized before being sent to
            remove potential security risks. We do not store the full content of AI conversations long-term,
            but may log metadata for security and abuse prevention.
          </p>

          <h3>1.4 Technical Information</h3>
          <p>We automatically collect:</p>
          <ul>
            <li>IP address (hashed for anonymization)</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>Time zone and locale settings</li>
            <li>Pages visited and features used</li>
            <li>Error logs and performance data</li>
          </ul>

          <h3>1.5 Cookies and Local Storage</h3>
          <p>We use:</p>
          <ul>
            <li><strong>Essential cookies:</strong> Required for authentication and security (CSRF tokens, session cookies)</li>
            <li><strong>Local storage:</strong> Stores preferences, cached data, and offline session data</li>
            <li><strong>Analytics cookies:</strong> Microsoft Clarity for usage analytics (with consent where required)</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li><strong>Provide the Service:</strong> Process your sessions, track progress, display analytics</li>
            <li><strong>Maintain security:</strong> Rate limiting, fraud prevention, abuse detection</li>
            <li><strong>Improve the Service:</strong> Analyze usage patterns, fix bugs, develop new features</li>
            <li><strong>Communicate:</strong> Send service-related notifications and updates</li>
            <li><strong>Legal compliance:</strong> Respond to legal requests and enforce our terms</li>
          </ul>

          <h2>3. Data Sharing and Disclosure</h2>

          <h3>3.1 Third-Party Service Providers</h3>
          <p>We share data with trusted third parties who assist in operating the Service:</p>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Provider</th>
                <th className="text-left p-2">Purpose</th>
                <th className="text-left p-2">Data Shared</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">Supabase</td>
                <td className="p-2">Database and authentication</td>
                <td className="p-2">Account data, session data</td>
              </tr>
              <tr>
                <td className="p-2">Vercel</td>
                <td className="p-2">Hosting and deployment</td>
                <td className="p-2">Technical logs, IP addresses</td>
              </tr>
              <tr>
                <td className="p-2">Google Gemini</td>
                <td className="p-2">AI coaching feature</td>
                <td className="p-2">Sanitized user prompts</td>
              </tr>
              <tr>
                <td className="p-2">Upstash Redis</td>
                <td className="p-2">Rate limiting</td>
                <td className="p-2">Hashed identifiers, request counts</td>
              </tr>
              <tr>
                <td className="p-2">Microsoft Clarity</td>
                <td className="p-2">Analytics</td>
                <td className="p-2">Anonymized usage data</td>
              </tr>
            </tbody>
          </table>

          <h3>3.2 We Do Not Sell Your Data</h3>
          <p>
            We do not sell, rent, or trade your personal information to third parties for marketing purposes.
          </p>

          <h3>3.3 Legal Requirements</h3>
          <p>We may disclose your information if required to:</p>
          <ul>
            <li>Comply with legal obligations or valid legal process</li>
            <li>Protect our rights, privacy, safety, or property</li>
            <li>Enforce our Terms of Service</li>
            <li>Respond to claims that content violates the rights of others</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>We implement multiple layers of security to protect your data:</p>
          <ul>
            <li><strong>Encryption:</strong> Data is encrypted in transit (TLS/HTTPS) and at rest</li>
            <li><strong>Authentication:</strong> Secure OAuth 2.0 with trusted providers</li>
            <li><strong>Access control:</strong> Row-level security ensures you can only access your own data</li>
            <li><strong>CSRF protection:</strong> All state-changing requests require valid CSRF tokens</li>
            <li><strong>Rate limiting:</strong> Protects against brute force and abuse attacks</li>
            <li><strong>Input validation:</strong> All user input is validated and sanitized server-side</li>
            <li><strong>Security headers:</strong> Strict CSP, HSTS, and other protective headers</li>
          </ul>
          <p>
            While we take security seriously, no method of transmission over the Internet is 100% secure.
            We cannot guarantee absolute security of your data.
          </p>

          <h2>5. Data Retention</h2>
          <ul>
            <li><strong>Active accounts:</strong> Data retained while your account is active</li>
            <li><strong>Deleted accounts:</strong> Data deleted within 30 days of account deletion</li>
            <li><strong>Shared sessions:</strong> Automatically expire based on selected duration (1 hour to 30 days, or never)</li>
            <li><strong>Analytics data:</strong> Anonymized analytics retained for up to 24 months</li>
            <li><strong>Security logs:</strong> Retained for up to 90 days for abuse prevention</li>
          </ul>

          <h2>6. Your Rights and Choices</h2>
          <p>Depending on your location, you may have the following rights:</p>

          <h3>6.1 Access and Portability</h3>
          <ul>
            <li>View your data through the dashboard and analytics pages</li>
            <li>Export your session data as PDF</li>
            <li>Request a copy of all your personal data</li>
          </ul>

          <h3>6.2 Correction and Deletion</h3>
          <ul>
            <li>Update your account information in Settings</li>
            <li>Delete individual sessions from your history</li>
            <li>Delete your entire account and all associated data</li>
          </ul>

          <h3>6.3 Consent and Objection</h3>
          <ul>
            <li>Withdraw consent for non-essential data processing</li>
            <li>Opt out of analytics tracking</li>
            <li>Object to processing based on legitimate interests</li>
          </ul>

          <h3>6.4 GDPR Rights (EU Users)</h3>
          <p>If you are in the European Union, you have additional rights under GDPR including:</p>
          <ul>
            <li>Right to access your personal data</li>
            <li>Right to rectification of inaccurate data</li>
            <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
          </ul>

          <h3>6.5 CCPA Rights (California Users)</h3>
          <p>If you are a California resident, you have the right to:</p>
          <ul>
            <li>Know what personal information is collected</li>
            <li>Know whether personal information is sold or disclosed</li>
            <li>Say no to the sale of personal information (we do not sell data)</li>
            <li>Request deletion of personal information</li>
            <li>Not be discriminated against for exercising your rights</li>
          </ul>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            The Service is intended for users 18 years of age or older. We do not knowingly collect personal
            information from anyone under 18. If we become aware that we have collected data from a minor,
            we will take steps to delete such information promptly.
          </p>

          <h2>8. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of
            residence. These countries may have different data protection laws. When we transfer data
            internationally, we ensure appropriate safeguards are in place, including:
          </p>
          <ul>
            <li>Standard contractual clauses approved by regulatory authorities</li>
            <li>Data processing agreements with our service providers</li>
            <li>Privacy Shield certifications where applicable</li>
          </ul>

          <h2>9. Third-Party Links</h2>
          <p>
            The Service may contain links to third-party websites or services. We are not responsible for
            the privacy practices of these third parties. We encourage you to read the privacy policies of
            any third-party sites you visit.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by:
          </p>
          <ul>
            <li>Posting the updated policy on this page with a new effective date</li>
            <li>Sending an email notification for significant changes</li>
            <li>Displaying a notice within the Service</li>
          </ul>
          <p>
            Your continued use of the Service after any changes indicates your acceptance of the updated policy.
          </p>

          <h2>11. Contact Information</h2>
          <p>For privacy-related questions, concerns, or to exercise your rights, please contact:</p>
          <ul>
            <li>Email: carterlasalle@gmail.com</li>
            <li>GitHub: <a href="https://github.com/carterlasalle/staminatimer" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">github.com/carterlasalle/staminatimer</a></li>
          </ul>
          <p>
            We will respond to your request within 30 days. For EU residents, you may also contact the data
            protection authority in your country if you have concerns about our data practices.
          </p>

          <h2>12. Legal Basis for Processing (GDPR)</h2>
          <p>We process personal data under the following legal bases:</p>
          <ul>
            <li><strong>Contract:</strong> Processing necessary to provide the Service you requested</li>
            <li><strong>Consent:</strong> Where you have given explicit consent (e.g., analytics)</li>
            <li><strong>Legitimate interests:</strong> Security, fraud prevention, service improvement</li>
            <li><strong>Legal obligation:</strong> Compliance with applicable laws</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
