import { initWorkers } from '../lib/queues';

console.log('🚀 Starting Monet background workers...');

// Initialize BullMQ workers
initWorkers();

console.log('✅ Workers initialized and listening for jobs');
console.log('   - QC validation worker');
console.log('   - Notification/nudge worker');
console.log('\nPress Ctrl+C to stop');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down workers gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down workers gracefully...');
  process.exit(0);
});
