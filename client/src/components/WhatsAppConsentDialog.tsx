
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, CheckCircle2 } from "lucide-react";

interface WhatsAppConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

const TERMS_OF_SERVICE = `
**WhatsApp Business Messaging Terms**

By connecting your WhatsApp account, you agree to:

1. **Account Usage**: Use this connection solely for business communication with customers who have opted in to receive messages.

2. **Compliance**: Follow WhatsApp's Business Policy and South African POPIA regulations.

3. **Message Limits**: Respect daily message limits (1,000 messages/day for new accounts, scaling up to 100,000/day).

4. **Customer Consent**: Only send messages to customers who have explicitly opted in to WhatsApp communication.

5. **Opt-Out Rights**: Honor all opt-out requests immediately when customers reply STOP.

6. **Data Protection**: Keep customer data secure and not share it with unauthorized parties.

7. **Prohibited Content**: Never send spam, promotional messages to non-consenting users, or violate WhatsApp's policies.

**Violations may result in account suspension by WhatsApp/Meta.**

By scanning the QR code, you confirm you have read and agree to these terms.
`.trim();

export function WhatsAppConsentDialog({
  open,
  onOpenChange,
  onAccept,
}: WhatsAppConsentDialogProps) {
  const [hasRead, setHasRead] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (agreed && hasRead) {
      onAccept();
      onOpenChange(false);
      // Reset for next time
      setHasRead(false);
      setAgreed(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            WhatsApp Business Terms & Consent
          </DialogTitle>
          <DialogDescription>
            Please review and accept these terms before connecting your WhatsApp account
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-4 text-sm">
            {TERMS_OF_SERVICE.split('\n\n').map((paragraph, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="read"
              checked={hasRead}
              onCheckedChange={(checked) => setHasRead(checked === true)}
            />
            <label
              htmlFor="read"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and understood the WhatsApp Business Messaging Terms
            </label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              disabled={!hasRead}
            />
            <label
              htmlFor="agree"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to comply with WhatsApp's policies and POPIA regulations
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!agreed || !hasRead}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
