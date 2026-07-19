
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

async function fixSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  
  try {
    console.log("Checking for missing columns...");
    
    // Check if columns exist
    const checkBusinesses = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'businesses' 
      AND column_name IN ('default_payment_due_days', 'payment_reminder_days')
    `);
    
    const checkInvoices = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name IN ('reminders_sent', 'last_reminder_sent_at')
    `);
    
    console.log(`Found ${checkBusinesses.rows.length} of 2 payment settings columns in businesses table`);
    console.log(`Found ${checkInvoices.rows.length} of 2 reminder columns in invoices table`);
    
    // Add missing columns to businesses table
    if (checkBusinesses.rows.length < 2) {
      console.log("Adding missing columns to businesses table...");
      
      const hasPaymentDueDays = checkBusinesses.rows.some(r => r.column_name === 'default_payment_due_days');
      const hasReminderDays = checkBusinesses.rows.some(r => r.column_name === 'payment_reminder_days');
      
      if (!hasPaymentDueDays) {
        console.log("Adding default_payment_due_days column...");
        await client.query(`
          ALTER TABLE businesses 
          ADD COLUMN default_payment_due_days INTEGER DEFAULT 30
        `);
      }
      
      if (!hasReminderDays) {
        console.log("Adding payment_reminder_days column...");
        await client.query(`
          ALTER TABLE businesses 
          ADD COLUMN payment_reminder_days JSONB DEFAULT '[3, 7, 14]'::jsonb
        `);
      }
      
      console.log("✅ Businesses table columns added successfully");
    } else {
      console.log("✅ Businesses table already has all required columns");
    }
    
    // Add missing columns to invoices table
    if (checkInvoices.rows.length < 2) {
      console.log("Adding missing columns to invoices table...");
      
      const hasRemindersSent = checkInvoices.rows.some(r => r.column_name === 'reminders_sent');
      const hasLastReminderSent = checkInvoices.rows.some(r => r.column_name === 'last_reminder_sent_at');
      
      if (!hasRemindersSent) {
        console.log("Adding reminders_sent column...");
        await client.query(`
          ALTER TABLE invoices
          ADD COLUMN reminders_sent INTEGER DEFAULT 0
        `);
      }
      
      if (!hasLastReminderSent) {
        console.log("Adding last_reminder_sent_at column...");
        await client.query(`
          ALTER TABLE invoices
          ADD COLUMN last_reminder_sent_at TIMESTAMP
        `);
      }
      
      console.log("✅ Invoices table columns added successfully");
    } else {
      console.log("✅ Invoices table already has all required columns");
    }
    
    console.log("\n✅ Schema fix completed successfully!");
    
  } catch (error) {
    console.error("❌ Schema fix failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
