import { initWorkers, shutdownWorkers } from '../lib/queues';

console.log('🚀 Starting Monet background workers...');

// Initialize BullMQ workers
const workers = initWorkers();

console.log('✅ Workers initialized and listening for jobs');
console.log('   - QC validation worker');
console.log('   - Notification/nudge worker');
console.log('\nPress Ctrl+C to stop');

// Graceful shutdown with proper cleanup
async function shutdown() {
  console.log('\n🛑 Shutting down workers gracefully...');
  try {
    await shutdownWorkers();
    console.log('✅ Workers shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
