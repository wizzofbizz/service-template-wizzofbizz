
import { runEmailReminders } from "./scheduled-jobs";

// Entry point for a scheduled run (cron, systemd timer, or a container job)
runEmailReminders()
  .then(() => {
    console.log('Email reminders completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Email reminders failed:', error);
    process.exit(1);
  });
