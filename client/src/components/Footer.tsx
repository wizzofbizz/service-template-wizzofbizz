
import { Link } from "wouter";
import { Orbit } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black text-white py-20">
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Orbit className="h-6 w-6 text-white" />
              <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '18px' }}>ServiceLoop</span>
            </div>
            <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '21px' }} className="text-white/60">
              Professional websites and business tools for South African service businesses.
            </p>
          </div>

          <div>
            <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '12px', letterSpacing: '0.3em' }} className="mb-6 text-white uppercase">Product</h4>
            <ul className="space-y-4">
              <li><Link href="/features/get-noticed" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/register" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60 hover:text-white transition-colors">Free Trial</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '12px', letterSpacing: '0.3em' }} className="mb-6 text-white uppercase">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/faq" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60 hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/help" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60 hover:text-white transition-colors">Help Center</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '12px', letterSpacing: '0.3em' }} className="mb-6 text-white uppercase">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy-policy" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-10">
          <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/40">
            &copy; 2025 ServiceLoop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
