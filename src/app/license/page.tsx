import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default function LicensePage() {
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
          <CardTitle className="text-2xl">Software License</CardTitle>
          <p className="text-sm text-muted-foreground">MIT License</p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <div className="bg-muted p-6 rounded-lg font-mono text-sm">
            <p className="font-bold mb-4">MIT License</p>
            <p className="mb-4">Copyright (c) 2024-2025 Carter LaSalle</p>
            <p className="mb-4">
              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files (the &quot;Software&quot;), to deal
              in the Software without restriction, including without limitation the rights
              to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
              copies of the Software, and to permit persons to whom the Software is
              furnished to do so, subject to the following conditions:
            </p>
            <p className="mb-4">
              The above copyright notice and this permission notice shall be included in all
              copies or substantial portions of the Software.
            </p>
            <p className="uppercase">
              THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
              AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
              LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
              OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
              SOFTWARE.
            </p>
          </div>

          <h2 className="mt-8">What This Means</h2>
          <p>
            The MIT License is a permissive open-source license. This means you are free to:
          </p>
          <ul>
            <li><strong>Use</strong> the software for any purpose, including commercial applications</li>
            <li><strong>Modify</strong> the source code to suit your needs</li>
            <li><strong>Distribute</strong> copies of the original or modified software</li>
            <li><strong>Sublicense</strong> the software to others</li>
            <li><strong>Sell</strong> copies of the software</li>
          </ul>
          <p>
            The only requirements are that you include the original copyright notice and license
            text in any copies or substantial portions of the software.
          </p>

          <h2>Source Code</h2>
          <p>
            The complete source code for Stamina Timer is available on GitHub:
          </p>
          <a
            href="https://github.com/carterlasalle/staminatimer"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            github.com/carterlasalle/staminatimer
            <ExternalLink className="h-4 w-4" />
          </a>

          <h2>Third-Party Licenses</h2>
          <p>
            Stamina Timer is built using various open-source libraries and frameworks.
            Key dependencies include:
          </p>
          <ul>
            <li><strong>Next.js</strong> - MIT License</li>
            <li><strong>React</strong> - MIT License</li>
            <li><strong>Tailwind CSS</strong> - MIT License</li>
            <li><strong>Radix UI</strong> - MIT License</li>
            <li><strong>Lucide Icons</strong> - ISC License</li>
            <li><strong>Supabase</strong> - Apache 2.0 License</li>
            <li><strong>Recharts</strong> - MIT License</li>
          </ul>
          <p>
            For a complete list of dependencies and their licenses, please refer to the
            package.json file in the source repository.
          </p>

          <h2>Contributing</h2>
          <p>
            Contributions to Stamina Timer are welcome. By contributing to this project,
            you agree that your contributions will be licensed under the MIT License.
          </p>

          <h2>Contact</h2>
          <p>
            For licensing questions or concerns, please contact:
          </p>
          <ul>
            <li>Email: carterlasalle@gmail.com</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
