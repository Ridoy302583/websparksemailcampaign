import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const contactSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional()
});

export const validateSendEmail = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    to: Joi.string().email().required(),
    subject: Joi.string().required(),
    html: Joi.string().required(),
    from: Joi.string().optional(),
    fromName: Joi.string().optional(),
    fromEmail: Joi.string().email().optional()
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

export const validateSendCampaign = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    contacts: Joi.array().items(contactSchema).min(1).required(),
    subject: Joi.string().required(),
    template: Joi.string().required(),
    from: Joi.string().optional(),
    fromName: Joi.string().optional(),
    fromEmail: Joi.string().email().optional()
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

export const validateSendBulkCampaign = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    jobId: Joi.string().required(),
    contacts: Joi.array().items(contactSchema).min(1).required(),
    subject: Joi.string().required(),
    html: Joi.string().required(),
    from: Joi.string().optional(),
    fromName: Joi.string().optional(),
    fromEmail: Joi.string().email().optional(),
    batchSize: Joi.number().min(1).max(50).optional(),
    delayBetweenBatches: Joi.number().min(100).optional()
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
