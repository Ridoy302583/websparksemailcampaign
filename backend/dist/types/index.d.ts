export interface Contact {
    email: string;
    firstName?: string;
    lastName?: string;
}
export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}
export interface EmailJob {
    id: string;
    totalEmails: number;
    sent: number;
    success: number;
    failed: number;
    pending: number;
    status: 'running' | 'completed' | 'failed' | 'paused' | 'stopped';
    startTime: Date;
    endTime?: Date;
    totalBatches: number;
    currentBatch: number;
    errors: EmailError[];
    retries: number;
    fromAddress: string;
    successfulEmails?: Array<{
        email: string;
        success: boolean;
        messageId?: string;
        timestamp: string;
    }>;
    currentEmail?: string;
}
export interface EmailError {
    email: string;
    error: string;
    timestamp: Date;
}
export interface EmailResult {
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp?: string;
}
export interface SendEmailRequest {
    to: string;
    subject: string;
    html: string;
    from?: string;
    fromName?: string;
    fromEmail?: string;
}
export interface SendCampaignRequest {
    contacts: Contact[];
    subject: string;
    template: string;
    from?: string;
    fromName?: string;
    fromEmail?: string;
}
export interface SendBulkCampaignRequest {
    jobId: string;
    contacts: Contact[];
    subject: string;
    html: string;
    from?: string;
    fromName?: string;
    fromEmail?: string;
    batchSize?: number;
    delayBetweenBatches?: number;
}
//# sourceMappingURL=index.d.ts.map
