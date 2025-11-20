import { Shield, Lock, Check, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const certifications = [
  {
    icon: Shield,
    logo: "/logos/PNG_SOC-2-Type-2-Logo.webp",
    title: "SOC 2 Type II Certified",
    description: "Our infrastructure and processes meet the highest standards for security, availability, and confidentiality. Independently audited annually to ensure compliance with strict security controls.",
  },
  {
    icon: FileCheck,
    logo: "/logos/iso-27001.png",
    title: "ISO 27001 Certified",
    description: "International standard for information security management. We implement comprehensive security policies, risk assessments, and continuous improvement processes to protect your data.",
  },
  {
    icon: Check,
    logo: "/logos/conformite-rgpd.png",
    title: "GDPR Compliant",
    description: "Full compliance with European data protection regulations. Your data rights are respected: right to access, rectification, erasure, and data portability. We never train our AI on your documents.",
  },
  {
    icon: Lock,
    logo: "/logos/AES256-body-camera-1.webp",
    title: "AES-256 Encryption",
    description: "Bank-grade encryption for all your data. Files are encrypted at rest and in transit using industry-standard AES-256 encryption. Your financial data is automatically deleted after 30 days.",
  },
];

const SecurityCompliance = () => {
  return (
    <div id="security" className="w-full py-12 xs:py-20 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight">
            Security & Compliance You Can Trust
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Your financial data deserves the highest level of protection. We maintain enterprise-grade security standards and comply with international regulations to keep your information safe.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-12">
          {certifications.map((cert) => (
            <Card key={cert.title} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="h-16 w-16 flex items-center justify-center mb-4">
                  <img
                    src={cert.logo}
                    alt={cert.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">{cert.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {cert.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-background border-2 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Our Security Commitment</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We understand that you're trusting us with sensitive financial information. That's why security isn't just a feature—it's fundamental to everything we do. Our team continuously monitors and updates our security practices to stay ahead of emerging threats. We undergo regular third-party security audits and penetration testing to ensure your data remains protected. If you have specific security requirements or questions, our team is always available to discuss how we can meet your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityCompliance;
