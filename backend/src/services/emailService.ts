import nodemailer from 'nodemailer';
import { config } from '../config';
import { Contact, EmailJob, EmailResult, EmailError } from '../types';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private emailJobs: Map<string, EmailJob> = new Map();

  constructor() {
    this.transporter = nodemailer.createTransport(config.awsSes);
  }

  formatFromAddress(name: string = config.defaultFromName, email: string = config.defaultFromEmail): string {
    return `"${name}" <${email}>`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryEmailSend(mailOptions: nodemailer.SendMailOptions, retries: number = config.maxRetries): Promise<{ success: boolean; result?: any; error?: string }> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${mailOptions.to} (attempt ${attempt})`);
        return { success: true, result };
      } catch (error: any) {
        console.log(`❌ Email send attempt ${attempt} failed for ${mailOptions.to}:`, error.message);
        
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || 
            error.message.includes('throttling') || error.message.includes('rate')) {
          
          if (attempt < retries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ Rate limit hit, waiting ${delay}ms before retry...`);
            await this.sleep(delay);
            continue;
          }
        }
        
        if (attempt === retries) {
          console.log(`🚫 All retry attempts failed for ${mailOptions.to}`);
          return { success: false, error: error.message };
        }
      }
    }
    return { success: false, error: 'Unknown error' };
  }

  async sendSingleEmail(
    to: string,
    subject: string,
    html: string,
    fromName?: string,
    fromEmail?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; fromAddress: string }> {
    const formattedFrom = this.formatFromAddress(fromName, fromEmail);
    console.log(`📧 Sending single email from: ${formattedFrom} to: ${to}`);

    const mailOptions = {
      from: formattedFrom,
      to,
      subject,
      html
    };

    const emailResult = await this.retryEmailSend(mailOptions);
    
    if (emailResult.success) {
      return {
        success: true,
        messageId: emailResult.result.messageId,
        fromAddress: formattedFrom
      };
    } else {
      return {
        success: false,
        error: emailResult.error,
        fromAddress: formattedFrom
      };
    }
  }

  async sendCampaign(
    contacts: Contact[],
    subject: string,
    template: string,
    fromName?: string,
    fromEmail?: string
  ): Promise<{
    success: boolean;
    message: string;
    fromAddress: string;
    results: EmailResult[];
    stats: { successCount: number; failureCount: number; totalSent: number };
  }> {
    const formattedFrom = this.formatFromAddress(fromName, fromEmail);
    console.log(`📧 Sending campaign from: ${formattedFrom} to ${contacts.length} recipients`);
    
    const results: EmailResult[] = [];
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      try {
        let personalizedTemplate = template
          .replace(/\{\{firstName\}\}/g, contact.firstName || 'Valued Customer')
          .replace(/\{\{lastName\}\}/g, contact.lastName || '')
          .replace(/\{\{email\}\}/g, contact.email)
          .replace(/\{\{companyName\}\}/g, 'WebSparks AI');
        
        const mailOptions = {
          from: formattedFrom,
          to: contact.email,
          subject,
          html: personalizedTemplate
        };

        const emailResult = await this.retryEmailSend(mailOptions);
        
        if (emailResult.success) {
          results.push({
            email: contact.email,
            success: true,
            messageId: emailResult.result.messageId
          });
        } else {
          results.push({
            email: contact.email,
            success: false,
            error: emailResult.error
          });
        }
        
      } catch (error: any) {
        results.push({
          email: contact.email,
          success: false,
          error: error.message
        });
      }
      
      if (i < contacts.length - 1) {
        await this.sleep(config.delayBetweenEmails);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`✅ Campaign completed: ${successCount} successful, ${failureCount} failed`);

    return {
      success: true,
      message: `Campaign sent: ${successCount} successful, ${failureCount} failed`,
      fromAddress: formattedFrom,
      results,
      stats: { successCount, failureCount, totalSent: contacts.length }
    };
  }

  async sendBulkCampaign(
    jobId: string,
    contacts: Contact[],
    subject: string,
    html: string,
    fromName?: string,
    fromEmail?: string,
    batchSize: number = config.defaultBatchSize,
    delayBetweenBatches: number = config.delayBetweenBatches
  ): Promise<{
    success: boolean;
    message: string;
    jobId: string;
    results: {
      total: number;
      successful: number;
      failed: number;
      duration: number;
      fromAddress: string;
      details: EmailResult[];
    };
  }> {
    const formattedFrom = this.formatFromAddress(fromName, fromEmail);
    console.log(`📧 Using sender format: ${formattedFrom}`);
    
    const safeBatchSize = Math.min(batchSize, config.defaultBatchSize);
    const totalBatches = Math.ceil(contacts.length / safeBatchSize);

    console.log(`🚀 Starting bulk campaign: ${contacts.length} emails, ${totalBatches} batches of ${safeBatchSize}`);

    const job: EmailJob = {
      id: jobId,
      totalEmails: contacts.length,
      sent: 0,
      success: 0,
      failed: 0,
      pending: contacts.length,
      status: 'running',
      startTime: new Date(),
      totalBatches,
      currentBatch: 0,
      errors: [],
      retries: 0,
      fromAddress: formattedFrom
    };
    
    this.emailJobs.set(jobId, job);

    const results: EmailResult[] = [];
    
    // Process emails one by one sequentially
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      job.currentBatch = i + 1;
      job.currentEmail = contact.email;
      
      console.log(`📧 [${i + 1}/${contacts.length}] Starting email to: ${contact.email}`);
      
      try {
        let personalizedHtml = html
          .replace(/\{\{firstName\}\}/g, contact.firstName || 'Valued Customer')
          .replace(/\{\{lastName\}\}/g, contact.lastName || '')
          .replace(/\{\{email\}\}/g, contact.email)
          .replace(/\{\{companyName\}\}/g, 'WebSparks AI');
        
        const mailOptions = {
          from: formattedFrom,
          to: contact.email,
          subject,
          html: personalizedHtml
        };

        console.log(`📤 Sending email to: ${contact.email}`);
        const emailResult = await this.retryEmailSend(mailOptions);
        
        if (emailResult.success) {
          job.sent++;
          job.success++;
          job.pending--;
          
          const successResult = {
            email: contact.email,
            success: true,
            messageId: emailResult.result.messageId,
            timestamp: new Date().toISOString()
          };
          
          results.push(successResult);
          
          // Add to successful emails for real-time tracking
          if (!job.successfulEmails) job.successfulEmails = [];
          job.successfulEmails.push(successResult);
          
          console.log(`✅ [${i + 1}/${contacts.length}] Success: ${contact.email}`);
        } else {
          throw new Error(emailResult.error);
        }
        
      } catch (error: any) {
        job.sent++;
        job.failed++;
        job.pending--;
        
        const errorInfo = {
          email: contact.email,
          error: error.message,
          timestamp: new Date()
        };
        
        job.errors.push(errorInfo);
        
        results.push({
          email: contact.email,
          success: false,
          error: error.message
        });
        
        console.log(`❌ [${i + 1}/${contacts.length}] Failed: ${contact.email} - ${error.message}`);
      }
      
      // Update job status after each email
      this.emailJobs.set(jobId, { ...job });
      
      // Add delay between emails (except for the last one)
      if (i < contacts.length - 1) {
        console.log(`⏳ Waiting ${delayBetweenBatches}ms before next email...`);
        await this.sleep(delayBetweenBatches);
      }
    }

    job.status = 'completed';
    job.endTime = new Date();
    this.emailJobs.set(jobId, job);
    
    const duration = Math.floor((job.endTime.getTime() - job.startTime.getTime()) / 1000);
    console.log(`✅ Bulk campaign completed in ${duration} seconds: ${job.success} successful, ${job.failed} failed`);

    return {
      success: true,
      message: `Bulk campaign completed: ${job.success} successful, ${job.failed} failed`,
      jobId,
      results: {
        total: contacts.length,
        successful: job.success,
        failed: job.failed,
        duration: duration,
        fromAddress: formattedFrom,
        details: results
      }
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string; sender?: string; rateLimit?: string; batchSize?: number }> {
    try {
      await this.transporter.verify();
      console.log('✅ AWS SES connection test successful');
      return {
        success: true,
        message: 'AWS SES connection successful',
        sender: this.formatFromAddress(),
        rateLimit: `${config.sesRateLimit} emails/second`,
        batchSize: config.defaultBatchSize
      };
    } catch (error: any) {
      console.error('❌ AWS SES connection test failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  getJob(jobId: string): EmailJob | undefined {
    return this.emailJobs.get(jobId);
  }

  getAllJobs(): EmailJob[] {
    return Array.from(this.emailJobs.values());
  }

  pauseJob(jobId: string): boolean {
    const job = this.emailJobs.get(jobId);
    if (!job) return false;
    
    job.status = 'paused';
    this.emailJobs.set(jobId, job);
    return true;
  }

  resumeJob(jobId: string): boolean {
    const job = this.emailJobs.get(jobId);
    if (!job) return false;
    
    job.status = 'running';
    this.emailJobs.set(jobId, job);
    return true;
  }

  stopJob(jobId: string): boolean {
    const job = this.emailJobs.get(jobId);
    if (!job) return false;
    
    job.status = 'stopped';
    job.endTime = new Date();
    this.emailJobs.set(jobId, job);
    return true;
  }
}
