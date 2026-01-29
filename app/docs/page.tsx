import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Star, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function PricingPage() {
  const rapidApiUrl = "https://rapidapi.com/dishis-technologies-maildrop/api/temp-mail-maildrop1"

  return (
    <div className="flex flex-col min-h-screen">
      {/* Pricing Section */}
      <section id="pricing" className="flex justify-center w-screen py-7 md:py-14 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Choose the plan that fits your needs. No hidden fees.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {/* Basic Plan */}
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Basic</CardTitle>
                <CardDescription>For testing and small projects</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0.00</span>
                  <span className="text-gray-500 dark:text-gray-400">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium">Requests</span>
                      <span className="ml-auto">151/Day</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hard Limit</div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        <span>Superfast Endpoints</span>
                      </li>
                      <li className="flex items-center">
                        <X className="mr-2 h-4 w-4 text-red-500" />
                        <span className="text-gray-500">Premium Servers</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Rate Limit</h4>
                    <p>1000 requests per hour</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <a href={rapidApiUrl} target="_blank" rel="noopener noreferrer">
                    Start Free Plan
                  </a>
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="flex flex-col h-full relative border-gray-900 dark:border-gray-100">
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <Badge className="bg-yellow-400 text-black hover:bg-yellow-400">
                  <Star className="mr-1 h-3 w-3" /> Recommended
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>For growing applications</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-gray-500 dark:text-gray-400">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium">Requests</span>
                      <span className="ml-auto">10,000/Month</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">+$0.003 per additional request</div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        <span>Superfast Endpoints</span>
                      </li>
                      <li className="flex items-center">
                        <X className="mr-2 h-4 w-4 text-red-500" />
                        <span className="text-gray-500">Premium Servers</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Rate Limit</h4>
                    <p>-</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
                  <a href={rapidApiUrl} target="_blank" rel="noopener noreferrer">
                    Choose This Plan
                  </a>
                </Button>
              </CardFooter>
            </Card>

            {/* Ultra Plan */}
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Ultra</CardTitle>
                <CardDescription>For professional applications</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29.99</span>
                  <span className="text-gray-500 dark:text-gray-400">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium">Requests</span>
                      <span className="ml-auto">40,000/Month</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">+$0.002 per additional request</div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        <span>Superfast Endpoints</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        <span>Premium Servers</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Rate Limit</h4>
                    <p>-</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <a href={rapidApiUrl} target="_blank" rel="noopener noreferrer">
                    Choose This Plan
                  </a>
                </Button>
              </CardFooter>
            </Card>

            {/* Mega Plan */}
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Mega</CardTitle>
                <CardDescription>For enterprise applications</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$99.99</span>
                  <span className="text-gray-500 dark:text-gray-400">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="font-medium">Requests</span>
                      <span className="ml-auto">600,000/Month</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">+$0.002 per additional request</div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        <span>Superfast Endpoints</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        <span>Premium Servers</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Rate Limit</h4>
                    <p>-</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <a href={rapidApiUrl} target="_blank" rel="noopener noreferrer">
                    Choose This Plan
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section id="documentation" className="flex justify-center w-screen py-12 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">API Documentation</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Everything you need to integrate MailDrop into your application
              </p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="encryption">Encryption</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-6 border rounded-lg mt-6 bg-white dark:bg-gray-950">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Getting Started</h3>
                <p>
                  The MailDrop API provides temporary email solutions for your applications. It&apos;s designed for efficient
                  mailbox management, including retrieving messages, checking server health, and handling encrypted
                  mailbox identifiers.
                </p>

                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-2">API Base URL:</h4>
                  <code className="text-sm">https://temp-mail-maildrop1.p.rapidapi.com</code>
                  <p className="mt-2 text-sm text-gray-500">Get your API key from RapidAPI</p>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Quick Start:</h4>
                  <p>
                    Send mail to:{" "}
                    <code>
                      {"{"}
                      <span className="text-green-600">name</span>
                      {"}"}
                    </code>
                    @junkstopper.info
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="endpoints" className="p-6 border rounded-lg mt-6 bg-white dark:bg-gray-950">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">API Endpoints</h3>

                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">
                          GET
                        </span>
                        <h4 className="ml-2 font-medium">/mailbox/{"{name}"}</h4>
                      </div>
                      <p className="mt-2 text-sm">Retrieve all messages in the mailbox of a specific user.</p>
                      <div className="mt-3">
                        <h5 className="text-sm font-medium">Response Example:</h5>
                        <pre className="p-3 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-xs">
                          {`{
  "success": true,
  "message": "Mailbox retrieved successfully.",
  "data": [
    {
      "id": "h7YSqaxFz",
      "from": "\"Dishant Singh\"",
      "to": "dishant",
      "subject": "asdf",
      "date": "2024-09-25T13:02:57.289Z"
    }
  ],
  "encryptedMailbox": "D-1qdvjaze"
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">
                          GET
                        </span>
                        <h4 className="ml-2 font-medium">
                          /mailbox/{"{name}"}/message/{"{id}"}
                        </h4>
                      </div>
                      <p className="mt-2 text-sm">Retrieve a specific email message from the user&apos;s mailbox.</p>
                      <div className="mt-3">
                        <h5 className="text-sm font-medium">Response Example:</h5>
                        <pre className="p-3 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-xs">
                          {`{
  "success": true,
  "message": "Message retrieved successfully.",
  "data": {
    "id": "7122AUPOL",
    "from": "dishant@junkstopper.info",
    "to": "dishant.singh",
    "subject": "Testing SMTP connectivity!",
    "date": "2024-09-25T06:10:24.271Z",
    "body": "...",
    "html": "<p>SMTP connectivity test...</p>"
  },
  "encryptedMailbox": "D-3670x23pe7gkt"
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-md">DELETE</span>
                        <h4 className="ml-2 font-medium">
                          /mailbox/{"{name}"}/message/{"{id}"}
                        </h4>
                      </div>
                      <p className="mt-2 text-sm">Deletes a specific email message from the user&apos;s mailbox.</p>
                      <div className="mt-3">
                        <h5 className="text-sm font-medium">Response Example:</h5>
                        <pre className="p-3 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-xs">
                          {`{
  "success": true,
  "message": "Message deleted successfully."
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">
                          GET
                        </span>
                        <h4 className="ml-2 font-medium">/health</h4>
                      </div>
                      <p className="mt-2 text-sm">Fetches server health statistics.</p>
                      <div className="mt-3">
                        <h5 className="text-sm font-medium">Response Example:</h5>
                        <pre className="p-3 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-xs">
                          {`{
  "success": true,
  "message": "Stats retrieved successfully.",
  "data": {
    "queued": 6,
    "denied": 35
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="encryption" className="p-6 border rounded-lg mt-6 bg-white dark:bg-gray-950">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Mailbox Encryption Process</h3>
                <p>
                  To protect mailbox identifiers, the system uses a custom encryption process. Below is a detailed
                  breakdown of how mailbox names are encrypted:
                </p>

                <div className="space-y-3 mt-4">
                  <div className="flex">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      <span>1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Remove Non-Alphanumeric Characters</h4>
                      <p className="text-sm text-gray-500">
                        All special characters, spaces, and punctuation are stripped from the mailbox name.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      <span>2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Convert to Long Integer</h4>
                      <p className="text-sm text-gray-500">
                        The alphanumeric characters are converted into a long integer.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      <span>3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Reverse Digits and Prepend &apos;1&apos;</h4>
                      <p className="text-sm text-gray-500">The digits are reversed and a &apos;1&apos; is prepended.</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      <span>4</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Add Private Modifier</h4>
                      <p className="text-sm text-gray-500">
                        A special private modifier (20190422) is added for additional security.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      <span>5</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Base36 Encoding</h4>
                      <p className="text-sm text-gray-500">
                        The modified integer is encoded into base36 (0-9 and A-Z).
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      <span>6</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Prefix the Encrypted Value</h4>
                      <p className="text-sm text-gray-500">
                        The final encrypted value is prepended with a designated prefix (e.g., D-).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mt-6">
                  <h4 className="font-medium mb-2">Example:</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Original Mailbox:</strong> dishant@mail.com
                    </p>
                    <p>
                      <strong>Step 1:</strong> dishantmailcom
                    </p>
                    <p>
                      <strong>Step 2:</strong> 12345678901234
                    </p>
                    <p>
                      <strong>Step 3:</strong> 143210987654321
                    </p>
                    <p>
                      <strong>Step 4:</strong> 143210987654321P
                    </p>
                    <p>
                      <strong>Step 5:</strong> 1qdvjaze
                    </p>
                    <p>
                      <strong>Step 6:</strong> D-1qdvjaze
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-2">Decoder Code:</h4>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-xs">
                    {`import bigInt from &apos;big-integer&apos;;

const ALTINBOX_MOD = bigInt("20190422");

export function decryptMailbox(encryptedMailbox: string): string {
  // Remove the prefix
  const withoutPrefix = encryptedMailbox.slice(2); // Remove &apos;D-&apos;
  
  // Convert from base36 to a number
  const decryptedNum = bigInt(withoutPrefix, 36);
  
  // Subtract the private modifier
  const adjustedNum = decryptedNum.subtract(ALTINBOX_MOD);
  
  // Convert back to string, remove the leading &apos;1&apos;, and reverse it
  const reversedString = adjustedNum.toString().slice(1).split("").reverse().join("");
  
  // Convert back to original base 36 (only alphanumeric characters)
  const originalMailbox = reversedString.replace(/[^0-9a-z]/gi, &apos;&apos;);
  
  return originalMailbox;
}`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="p-6 border rounded-lg mt-6 bg-white dark:bg-gray-950">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Security Considerations</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <span className="text-xl">🔒</span>
                      </div>
                      <h4 className="font-medium">Authentication & Authorization</h4>
                    </div>
                    <p className="mt-2 text-sm">
                      All sensitive endpoints require an authentication token for security, especially when accessing or
                      modifying mailbox data.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <span className="text-xl">🔐</span>
                      </div>
                      <h4 className="font-medium">Encryption</h4>
                    </div>
                    <p className="mt-2 text-sm">
                      Mailbox identifiers are encrypted to prevent unauthorized access and tampering. All encryption
                      algorithms follow industry best practices.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <span className="text-xl">⏱️</span>
                      </div>
                      <h4 className="font-medium">Rate Limiting</h4>
                    </div>
                    <p className="mt-2 text-sm">
                      The API applies rate limiting to prevent abuse, especially on endpoints such as mailbox deletion
                      and message retrieval.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <span className="text-xl">📊</span>
                      </div>
                      <h4 className="font-medium">Monitoring</h4>
                    </div>
                    <p className="mt-2 text-sm">
                      Our systems continuously monitor for suspicious activities and automatically block potential
                      threats.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mt-6">
                  <h4 className="font-medium mb-2">Best Practices:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Always use HTTPS for all API requests</li>
                    <li>Keep your API keys secure and never expose them in client-side code</li>
                    <li>Implement proper error handling in your applications</li>
                    <li>Regularly rotate your API keys for enhanced security</li>
                    <li>Monitor your API usage to detect any unauthorized access</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="flex justify-center w-screen py-12 md:py-24 bg-gray-900 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Get Started?</h2>
              <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                Sign up for MailDrop API today and start building with temporary email solutions.
              </p>
            </div>
            <div className="space-x-4 flex ">
              <Button asChild className="bg-white text-gray-900 hover:bg-gray-200">
                <a href={rapidApiUrl} target="_blank" rel="noopener noreferrer">
                  Try Now <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="border-white text-white hover:bg-gray-800 bg-gray-600">
                <Link href="#documentation">View Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
