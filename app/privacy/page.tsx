import { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, Database, UserCheck, FileText, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import CTABanner from "@/components/landing/cta-banner";
import { privacyMetadata } from "@/lib/metadata";

export const metadata: Metadata = privacyMetadata;

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-6 mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-muted-foreground mt-2">Last updated: November 17, 2025</p>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-3xl">
            At BS Convert, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our bank statement conversion service.
          </p>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Privacy at a Glance</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Your Data is Encrypted</h3>
                    <p className="text-sm text-muted-foreground">All files are encrypted using AES-256 encryption during transfer and storage.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">No AI Training</h3>
                    <p className="text-sm text-muted-foreground">We never use your documents to train our AI models or share them with third parties.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Automatic Deletion</h3>
                    <p className="text-sm text-muted-foreground">Your uploaded files are automatically deleted after 30 days.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">GDPR Compliant</h3>
                    <p className="text-sm text-muted-foreground">Full compliance with European data protection regulations and privacy rights.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Main Content */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Section 1 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              1. Information We Collect
            </h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Information You Provide</h3>
              <p className="text-muted-foreground mb-4">
                We collect information that you voluntarily provide when using our service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Account Information:</strong> Name, email address, password, and billing information</li>
                <li><strong>Bank Statements:</strong> PDF files you upload for conversion</li>
                <li><strong>Transaction Data:</strong> Extracted data from your bank statements (dates, descriptions, amounts)</li>
                <li><strong>Communication Data:</strong> Messages you send to our support team</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Automatically Collected Information</h3>
              <p className="text-muted-foreground mb-4">
                When you access our service, we automatically collect certain information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the platform</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                <li><strong>Log Data:</strong> Access times, error logs, and performance metrics</li>
                <li><strong>Cookies:</strong> Session identifiers and preference settings</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">1.3 Information from Third Parties</h3>
              <p className="text-muted-foreground">
                We may receive information from payment processors (Stripe) to process your subscription, and analytics providers (Google Analytics) to improve our service.
              </p>
            </div>
          </div>

          <Separator />

          {/* Section 2 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              2. How We Use Your Information
            </h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="text-muted-foreground mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Service Delivery:</strong> Process your bank statements and provide accurate conversions</li>
                <li><strong>Account Management:</strong> Create and maintain your account, process payments</li>
                <li><strong>Communication:</strong> Send service updates, respond to inquiries, provide customer support</li>
                <li><strong>Security:</strong> Detect and prevent fraud, unauthorized access, and security threats</li>
                <li><strong>Improvement:</strong> Analyze usage patterns to enhance our service quality</li>
                <li><strong>Compliance:</strong> Meet legal obligations and enforce our Terms of Service</li>
              </ul>

              <div className="bg-muted/50 border border-border rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Important: We Never Use Your Data for AI Training
                </h3>
                <p className="text-muted-foreground text-sm">
                  Your uploaded bank statements and financial data are processed solely for conversion purposes. We do not use this data to train our AI models, sell it to third parties, or use it for any purpose other than providing you with the service you requested.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 3 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              3. How We Protect Your Information
            </h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="text-muted-foreground mb-4">
                We implement industry-standard security measures to protect your data:
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Encryption</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>In Transit:</strong> All data transmission uses TLS 1.3 encryption (HTTPS)</li>
                <li><strong>At Rest:</strong> Files stored on our servers use AES-256 encryption</li>
                <li><strong>Database:</strong> Sensitive data is encrypted at the database level</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Access Controls</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Multi-factor authentication for administrative access</li>
                <li>Role-based access control limiting employee access to data</li>
                <li>Regular access audits and permission reviews</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Infrastructure Security</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Hosted on SOC 2 Type II certified infrastructure (Supabase/AWS)</li>
                <li>Regular security patches and updates</li>
                <li>Continuous monitoring and intrusion detection</li>
                <li>Regular third-party security audits and penetration testing</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Data Retention</h3>
              <p className="text-muted-foreground">
                <strong>Uploaded Files:</strong> Automatically deleted after 30 days<br />
                <strong>Conversion History:</strong> Retained for 12 months or until account deletion<br />
                <strong>Account Data:</strong> Retained while your account is active, deleted within 90 days of account closure
              </p>
            </div>
          </div>

          <Separator />

          {/* Section 4 */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              4. Your Privacy Rights (GDPR)
            </h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="text-muted-foreground mb-4">
                Under the General Data Protection Regulation (GDPR), you have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                <li><strong>Right to Access:</strong> Request a copy of all personal data we hold about you</li>
                <li><strong>Right to Rectification:</strong> Correct any inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data in certain circumstances</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to certain types of data processing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where we rely on consent</li>
                <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local supervisory authority</li>
              </ul>

              <div className="bg-muted/50 border border-border rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-2">How to Exercise Your Rights</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  To exercise any of these rights, please contact us at:
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> privacy@bsconvert.com<br />
                  <strong>Response Time:</strong> We will respond to your request within 30 days
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 5 */}
          <div>
            <h2 className="text-2xl font-bold mb-4">5. Data Sharing and Disclosure</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="text-muted-foreground mb-4">
                We do not sell your personal data. We may share your information only in the following limited circumstances:
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Service Providers</h3>
              <p className="text-muted-foreground mb-2">
                We work with trusted third-party service providers who assist us in operating our service:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Supabase:</strong> Database and authentication (SOC 2 Type II certified)</li>
                <li><strong>Stripe:</strong> Payment processing (PCI DSS compliant)</li>
                <li><strong>AWS:</strong> Cloud infrastructure and storage</li>
                <li><strong>Vercel:</strong> Application hosting and deployment</li>
              </ul>
              <p className="text-muted-foreground mt-3 text-sm">
                All service providers are bound by data processing agreements and can only use your data to provide services on our behalf.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Legal Requirements</h3>
              <p className="text-muted-foreground">
                We may disclose your information if required by law, court order, or government request, or to protect the rights, property, or safety of BS Convert, our users, or others.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Business Transfers</h3>
              <p className="text-muted-foreground">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before your data is transferred and becomes subject to a different privacy policy.
              </p>
            </div>
          </div>

          <Separator />

          {/* Section 6 */}
          <div>
            <h2 className="text-2xl font-bold mb-4">6. Cookies and Tracking Technologies</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-3">Types of Cookies We Use</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Essential Cookies (Required)</h4>
                  <p className="text-muted-foreground text-sm">
                    Necessary for the website to function. These include session cookies, authentication tokens, and security cookies.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">Functional Cookies (Optional)</h4>
                  <p className="text-muted-foreground text-sm">
                    Remember your preferences such as language, theme, and display settings.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-1">Analytics Cookies (Optional)</h4>
                  <p className="text-muted-foreground text-sm">
                    Help us understand how visitors use our website (Google Analytics). You can opt out of these cookies.
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground mt-6">
                You can control cookies through your browser settings. Note that disabling essential cookies may affect site functionality.
              </p>
            </div>
          </div>

          <Separator />

          {/* Section 7 */}
          <div>
            <h2 className="text-2xl font-bold mb-4">7. International Data Transfers</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="text-muted-foreground">
                BS Convert is based in France and processes data within the European Union. If you access our service from outside the EU, your data may be transferred to and processed in the EU. We ensure that all international transfers comply with GDPR requirements through:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Adequacy decisions for certain countries</li>
                <li>Appropriate safeguards to protect your data</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Section 8 */}
          <div>
            <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="text-muted-foreground">
                Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child without parental consent, we will take steps to delete such information promptly.
              </p>
            </div>
          </div>

          <Separator />

          {/* Section 9 */}
          <div>
            <h2 className="text-2xl font-bold mb-4">9. Changes to This Privacy Policy</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Posting the updated policy on this page with a new "Last Updated" date</li>
                <li>Sending an email notification to your registered email address</li>
                <li>Displaying a prominent notice on our website</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                We encourage you to review this Privacy Policy periodically. Your continued use of our service after changes are posted constitutes acceptance of the updated policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />

      <Footer />
    </div>
  );
}
