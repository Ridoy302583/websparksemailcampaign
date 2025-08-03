import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Default sender configuration
  defaultFromName: process.env.DEFAULT_FROM_NAME || 'Allmamun from Websparks',
  defaultFromEmail: process.env.DEFAULT_FROM_EMAIL || 'allmamun@websparks.ai',
  
  // SES Rate Limiting Configuration
  sesRateLimit: process.env.SES_RATE_LIMIT ? parseInt(process.env.SES_RATE_LIMIT, 10) : 14,
  defaultBatchSize: process.env.DEFAULT_BATCH_SIZE ? parseInt(process.env.DEFAULT_BATCH_SIZE, 10) : 10,
  delayBetweenEmails: process.env.DELAY_BETWEEN_EMAILS ? parseInt(process.env.DELAY_BETWEEN_EMAILS, 10) : 80,
  delayBetweenBatches: process.env.DELAY_BETWEEN_BATCHES ? parseInt(process.env.DELAY_BETWEEN_BATCHES, 10) : 1000,
  maxRetries: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES, 10) : 3,
  
  // AWS SES Configuration
  awsSes: {
    host: process.env.AWS_SES_HOST || 'email-smtp.us-east-1.amazonaws.com',
    port: process.env.AWS_SES_PORT ? parseInt(process.env.AWS_SES_PORT, 10) : 587,
    secure: process.env.AWS_SES_SECURE === 'true',
    auth: {
      user: process.env.AWS_SES_USER || 'AKIA3FLD4SRKSIO2IY53',
      pass: process.env.AWS_SES_PASS || 'BPkk/T7c5C3NwlfWXi9lZwZuWOBG5djdY2c+XWhnRrZK'
    }
  }
};
