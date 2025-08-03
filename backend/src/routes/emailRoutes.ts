import { Router } from 'express';
import { EmailService } from '../services/emailService';
import { validateSendEmail, validateSendCampaign, validateSendBulkCampaign } from '../middleware/validation';
import { SendEmailRequest, SendCampaignRequest, SendBulkCampaignRequest } from '../types';
import { config } from '../config';

// Remove caching to ensure real-time status
// Cache disabled for continuous real-time checking

const router = Router();
const emailService = new EmailService();

/**
 * @swagger
 * /api/send-email:
 *   post:
 *     summary: Send a single email
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - html
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address
 *               subject:
 *                 type: string
 *                 description: Email subject
 *               html:
 *                 type: string
 *                 description: HTML content of the email
 *               fromName:
 *                 type: string
 *                 description: Sender name
 *               fromEmail:
 *                 type: string
 *                 format: email
 *                 description: Sender email address
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
router.post('/send-email', validateSendEmail, async (req, res) => {
  try {
    const { to, subject, html, fromName, fromEmail }: SendEmailRequest = req.body;

    const result = await emailService.sendSingleEmail(to, subject, html, fromName, fromEmail);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        fromAddress: result.fromAddress
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error: any) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/send-campaign:
 *   post:
 *     summary: Send email campaign to multiple recipients
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contacts
 *               - subject
 *               - template
 *             properties:
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *               subject:
 *                 type: string
 *               template:
 *                 type: string
 *                 description: HTML template with variables like {{firstName}}
 *               fromName:
 *                 type: string
 *               fromEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Campaign sent successfully
 */
router.post('/send-campaign', validateSendCampaign, async (req, res) => {
  try {
    const { contacts, subject, template, fromName, fromEmail }: SendCampaignRequest = req.body;
    
    const result = await emailService.sendCampaign(contacts, subject, template, fromName, fromEmail);

    res.json(result);
  } catch (error: any) {
    console.error('❌ Campaign sending error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/send-bulk-campaign:
 *   post:
 *     summary: Send bulk email campaign with job tracking
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - contacts
 *               - subject
 *               - html
 *             properties:
 *               jobId:
 *                 type: string
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *               fromName:
 *                 type: string
 *               fromEmail:
 *                 type: string
 *                 format: email
 *               batchSize:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 50
 *               delayBetweenBatches:
 *                 type: number
 *                 minimum: 100
 *     responses:
 *       200:
 *         description: Bulk campaign completed successfully
 */
router.post('/send-bulk-campaign', validateSendBulkCampaign, async (req, res) => {
  try {
    const {
      jobId,
      contacts,
      subject,
      html,
      fromName,
      fromEmail,
      batchSize,
      delayBetweenBatches
    }: SendBulkCampaignRequest = req.body;
    
    const result = await emailService.sendBulkCampaign(
      jobId,
      contacts,
      subject,
      html,
      fromName,
      fromEmail,
      batchSize,
      delayBetweenBatches
    );

    res.json(result);
  } catch (error: any) {
    console.error('❌ Bulk campaign error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/job-status/{jobId}:
 *   get:
 *     summary: Get job status by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *       404:
 *         description: Job not found
 */
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

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: All jobs retrieved successfully
 */
router.get('/jobs', (req, res) => {
  const jobs = emailService.getAllJobs();
  res.json({
    success: true,
    jobs
  });
});

/**
 * @swagger
 * /api/pause-job/{jobId}:
 *   post:
 *     summary: Pause a job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job paused successfully
 *       404:
 *         description: Job not found
 */
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

/**
 * @swagger
 * /api/resume-job/{jobId}:
 *   post:
 *     summary: Resume a paused job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job resumed successfully
 *       404:
 *         description: Job not found
 */
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

/**
 * @swagger
 * /api/stop-job/{jobId}:
 *   post:
 *     summary: Stop a running job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job stopped successfully
 *       404:
 *         description: Job not found
 */
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

/**
 * @swagger
 * /api/test-connection:
 *   get:
 *     summary: Test email server connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Connection test successful
 *       500:
 *         description: Connection test failed
 */
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🔄 Real-time connection test');
    const result = await emailService.testConnection();
    
    if (result.success) {
      console.log('✅ Connection test successful');
      res.json(result);
    } else {
      console.log('❌ Connection test failed');
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.log('❌ Connection test error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
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
      rateLimit: `${config.sesRateLimit} emails/second`,
      batchSize: config.defaultBatchSize,
      emailDelay: `${config.delayBetweenEmails}ms`,
      batchDelay: `${config.delayBetweenBatches}ms`
    }
  };
  
  console.log('✅ Health check successful');
  res.json(healthData);
});

export default router;
