"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailService_1 = require("../services/emailService");
const validation_1 = require("../middleware/validation");
const config_1 = require("../config");
const router = (0, express_1.Router)();
const emailService = new emailService_1.EmailService();
router.post('/send-email', validation_1.validateSendEmail, async (req, res) => {
    try {
        const { to, subject, html, fromName, fromEmail } = req.body;
        const result = await emailService.sendSingleEmail(to, subject, html, fromName, fromEmail);
        if (result.success) {
            res.json({
                success: true,
                message: 'Email sent successfully',
                messageId: result.messageId,
                fromAddress: result.fromAddress
            });
        }
        else {
            throw new Error(result.error);
        }
    }
    catch (error) {
        console.error('❌ Email sending error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/send-campaign', validation_1.validateSendCampaign, async (req, res) => {
    try {
        const { contacts, subject, template, fromName, fromEmail } = req.body;
        const result = await emailService.sendCampaign(contacts, subject, template, fromName, fromEmail);
        res.json(result);
    }
    catch (error) {
        console.error('❌ Campaign sending error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/send-bulk-campaign', validation_1.validateSendBulkCampaign, async (req, res) => {
    try {
        const { jobId, contacts, subject, html, fromName, fromEmail, batchSize, delayBetweenBatches } = req.body;
        const result = await emailService.sendBulkCampaign(jobId, contacts, subject, html, fromName, fromEmail, batchSize, delayBetweenBatches);
        res.json(result);
    }
    catch (error) {
        console.error('❌ Bulk campaign error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/job-status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = emailService.getJob(jobId);
    if (!job) {
        return res.status(404).json({
            success: false,
            message: 'Job not found'
        });
    }
    res.json({
        success: true,
        job
    });
});
router.get('/jobs', (req, res) => {
    const jobs = emailService.getAllJobs();
    res.json({
        success: true,
        jobs
    });
});
router.post('/pause-job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const success = emailService.pauseJob(jobId);
    if (!success) {
        return res.status(404).json({
            success: false,
            message: 'Job not found'
        });
    }
    res.json({
        success: true,
        message: 'Job paused successfully'
    });
});
router.post('/resume-job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const success = emailService.resumeJob(jobId);
    if (!success) {
        return res.status(404).json({
            success: false,
            message: 'Job not found'
        });
    }
    res.json({
        success: true,
        message: 'Job resumed successfully'
    });
});
router.post('/stop-job/:jobId', (req, res) => {
    const { jobId } = req.params;
    const success = emailService.stopJob(jobId);
    if (!success) {
        return res.status(404).json({
            success: false,
            message: 'Job not found'
        });
    }
    res.json({
        success: true,
        message: 'Job stopped successfully'
    });
});
router.get('/test-connection', async (req, res) => {
    try {
        console.log('🔄 Real-time connection test');
        const result = await emailService.testConnection();
        if (result.success) {
            console.log('✅ Connection test successful');
            res.json(result);
        }
        else {
            console.log('❌ Connection test failed');
            res.status(500).json(result);
        }
    }
    catch (error) {
        console.log('❌ Connection test error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.get('/health', (req, res) => {
    console.log('📊 Real-time health check');
    const healthData = {
        success: true,
        message: 'Email server is running',
        timestamp: new Date().toISOString(),
        activeJobs: emailService.getAllJobs().length,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        config: {
            sender: emailService.formatFromAddress(),
            rateLimit: `${config_1.config.sesRateLimit} emails/second`,
            batchSize: config_1.config.defaultBatchSize,
            emailDelay: `${config_1.config.delayBetweenEmails}ms`,
            batchDelay: `${config_1.config.delayBetweenBatches}ms`
        }
    };
    console.log('✅ Health check successful');
    res.json(healthData);
});
exports.default = router;
//# sourceMappingURL=emailRoutes.js.map
