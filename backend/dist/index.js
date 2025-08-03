"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const server = app_1.default.listen(config_1.config.port, () => {
    console.log(`🚀 Email server running on port ${config_1.config.port}`);
    console.log(`📧 Default sender: ${config_1.config.defaultFromName} <${config_1.config.defaultFromEmail}>`);
    console.log(`⚡ SES Rate Limit: ${config_1.config.sesRateLimit} emails/second`);
    console.log(`📦 Batch Size: ${config_1.config.defaultBatchSize} emails`);
    console.log(`⏱️  Email Delay: ${config_1.config.delayBetweenEmails}ms`);
    console.log(`⏱️  Batch Delay: ${config_1.config.delayBetweenBatches}ms`);
    console.log(`🔄 Max Retries: ${config_1.config.maxRetries}`);
    console.log(`📚 API Documentation: http://localhost:${config_1.config.port}/api-docs`);
    console.log('✅ Server ready to send emails!');
});
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
//# sourceMappingURL=index.js.map
