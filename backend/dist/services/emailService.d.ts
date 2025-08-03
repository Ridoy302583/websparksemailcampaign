import { Contact, EmailJob, EmailResult } from '../types';
export declare class EmailService {
    private transporter;
    private emailJobs;
    constructor();
    formatFromAddress(name?: string, email?: string): string;
    private sleep;
    private retryEmailSend;
    sendSingleEmail(to: string, subject: string, html: string, fromName?: string, fromEmail?: string): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
        fromAddress: string;
    }>;
    sendCampaign(contacts: Contact[], subject: string, template: string, fromName?: string, fromEmail?: string): Promise<{
        success: boolean;
        message: string;
        fromAddress: string;
        results: EmailResult[];
        stats: {
            successCount: number;
            failureCount: number;
            totalSent: number;
        };
    }>;
    sendBulkCampaign(jobId: string, contacts: Contact[], subject: string, html: string, fromName?: string, fromEmail?: string, batchSize?: number, delayBetweenBatches?: number): Promise<{
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
    }>;
    testConnection(): Promise<{
        success: boolean;
        message: string;
        sender?: string;
        rateLimit?: string;
        batchSize?: number;
    }>;
    getJob(jobId: string): EmailJob | undefined;
    getAllJobs(): EmailJob[];
    pauseJob(jobId: string): boolean;
    resumeJob(jobId: string): boolean;
    stopJob(jobId: string): boolean;
}
//# sourceMappingURL=emailService.d.ts.map
