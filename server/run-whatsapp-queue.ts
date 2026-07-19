
import { processAllWhatsAppQueues } from "./whatsapp-queue";

console.log('🚀 Starting WhatsApp queue processor...');
console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

processAllWhatsAppQueues()
  .then((totalSent) => {
    console.log(`\n✅ WhatsApp queue processing completed`);
    console.log(`📊 Total messages sent: ${totalSent}`);
    console.log(`⏰ Finished at: ${new Date().toISOString()}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ WhatsApp queue processing failed:', error);
    process.exit(1);
  });
