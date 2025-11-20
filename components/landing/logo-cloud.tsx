import { HTMLAttributes } from "react";
import { Shield, Lock, Check, Award } from "lucide-react";

function LogoCloud(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      <p className="text-center text-sm text-muted-foreground font-medium mb-6">
        Trusted and Certified
      </p>
      <div className="flex items-center justify-center flex-wrap gap-8 text-muted-foreground">
        {/* SOC 2 Type II */}
        <div className="flex flex-col items-center gap-2 px-4">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-500/10">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-xs font-medium text-center">SOC 2<br/>Type II</span>
        </div>

        {/* ISO 27001 */}
        <div className="flex flex-col items-center gap-2 px-4">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-green-500/10">
            <Award className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-xs font-medium text-center">ISO<br/>27001</span>
        </div>

        {/* GDPR Compliant */}
        <div className="flex flex-col items-center gap-2 px-4">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-purple-500/10">
            <Check className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-center">GDPR<br/>Compliant</span>
        </div>

        {/* AES-256 Encryption */}
        <div className="flex flex-col items-center gap-2 px-4">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-orange-500/10">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <span className="text-xs font-medium text-center">AES-256<br/>Encrypted</span>
        </div>
      </div>
    </div>
  );
}

export default LogoCloud;
