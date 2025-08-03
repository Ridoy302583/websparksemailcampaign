import app from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`🚀 Email server running on port ${config.port}`);
  console.log(`📧 Default sender: ${config.defaultFromName} <${config.defaultFromEmail}>`);
  console.log(`⚡ SES Rate Limit: ${config.sesRateLimit} emails/second`);
  console.log(`📦 Batch Size: ${config.defaultBatchSize} emails`);
  console.log(`⏱️  Email Delay: ${config.delayBetweenEmails}ms`);
  console.log(`⏱️  Batch Delay: ${config.delayBetweenBatches}ms`);
  console.log(`🔄 Max Retries: ${config.maxRetries}`);
  console.log(`📚 API Documentation: http://localhost:${config.port}/api-docs`);
  console.log('✅ Server ready to send emails!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
