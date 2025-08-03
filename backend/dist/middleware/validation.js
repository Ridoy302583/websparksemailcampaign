"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSendBulkCampaign = exports.validateSendCampaign = exports.validateSendEmail = void 0;
const joi_1 = __importDefault(require("joi"));
const contactSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    firstName: joi_1.default.string().optional(),
    lastName: joi_1.default.string().optional()
});
const validateSendEmail = (req, res, next) => {
    const schema = joi_1.default.object({
        to: joi_1.default.string().email().required(),
        subject: joi_1.default.string().required(),
        html: joi_1.default.string().required(),
        from: joi_1.default.string().optional(),
        fromName: joi_1.default.string().optional(),
        fromEmail: joi_1.default.string().email().optional()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};
exports.validateSendEmail = validateSendEmail;
const validateSendCampaign = (req, res, next) => {
    const schema = joi_1.default.object({
        contacts: joi_1.default.array().items(contactSchema).min(1).required(),
        subject: joi_1.default.string().required(),
        template: joi_1.default.string().required(),
        from: joi_1.default.string().optional(),
        fromName: joi_1.default.string().optional(),
        fromEmail: joi_1.default.string().email().optional()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};
exports.validateSendCampaign = validateSendCampaign;
const validateSendBulkCampaign = (req, res, next) => {
    const schema = joi_1.default.object({
        jobId: joi_1.default.string().required(),
        contacts: joi_1.default.array().items(contactSchema).min(1).required(),
        subject: joi_1.default.string().required(),
        html: joi_1.default.string().required(),
        from: joi_1.default.string().optional(),
        fromName: joi_1.default.string().optional(),
        fromEmail: joi_1.default.string().email().optional(),
        batchSize: joi_1.default.number().min(1).max(50).optional(),
        delayBetweenBatches: joi_1.default.number().min(100).optional()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }
    next();
};
exports.validateSendBulkCampaign = validateSendBulkCampaign;
//# sourceMappingURL=validation.js.map
