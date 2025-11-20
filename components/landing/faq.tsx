import {
  Clock,
  FileText,
  Shield,
  Zap,
  CreditCard,
  HelpCircle,
} from "lucide-react";

const faq = [
  {
    icon: FileText,
    question: "Which file formats do you support?",
    answer:
      "We support PDF bank statements from 500+ banks worldwide. We can extract data from scanned PDFs, digital PDFs, and even statements with complex tables or multiple accounts.",
  },
  {
    icon: Zap,
    question: "How accurate is the AI extraction?",
    answer:
      "Our Grok AI-powered engine achieves 99% accuracy on bank statements. We use advanced machine learning to recognize transaction patterns, even with inconsistent formatting or handwritten notes.",
  },
  {
    icon: Clock,
    question: "How long does conversion take?",
    answer:
      "Most conversions complete in under 30 seconds. Large documents (100+ pages) may take up to 2 minutes. You'll receive a notification when your file is ready to download.",
  },
  {
    icon: CreditCard,
    question: "Do I need a credit card to start?",
    answer:
      "No credit card required for the Starter plan. You get 20 free conversions per month forever. Upgrade to Professional anytime for unlimited conversions and advanced features.",
  },
  {
    icon: Shield,
    question: "Is my financial data secure?",
    answer:
      "Yes. We use AES-256 encryption, are SOC 2 Type II certified, and GDPR compliant. Your data is encrypted at rest and in transit. We never train our AI on your documents and delete files after 30 days.",
  },
  {
    icon: HelpCircle,
    question: "What export formats are available?",
    answer:
      "We support FEC (French legal format), Sage 100c, Cegid Loop, QuickBooks, Xero, Excel (XLSX), and CSV. All formats include proper formatting and can be directly imported into your accounting software.",
  },
];

const FAQ = () => {
  return (
    <div
      id="faq"
      className="flex items-center justify-center px-6 py-12 xs:py-20"
    >
      <div className="max-w-screen-xl w-full">
        <h2 className="text-3xl xs:text-4xl md:text-5xl !leading-[1.15] font-bold tracking-tight text-center">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 xs:text-lg text-center text-muted-foreground">
          Everything you need to know about BS Convert and our services.
        </p>

        <div className="mt-12 grid md:grid-cols-2 bg-background rounded-xl overflow-hidden outline outline-[1px] outline-border outline-offset-[-1px]">
          {faq.map(({ question, answer, icon: Icon }) => (
            <div key={question} className="border p-6 -mt-px -ml-px">
              <div className="h-8 w-8 xs:h-10 xs:w-10 flex items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 xs:h-6 xs:w-6 text-primary" />
              </div>
              <div className="mt-3 mb-2 flex items-start gap-2 text-lg xs:text-[1.35rem] font-semibold tracking-tight">
                <span>{question}</span>
              </div>
              <p className="text-sm xs:text-base text-muted-foreground">{answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
