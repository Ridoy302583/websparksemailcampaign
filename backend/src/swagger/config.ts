// src/swagger/config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Email Server API',
      version: '1.0.0',
      description: 'A comprehensive email server API with AWS SES integration',
      contact: {
        name: 'API Support',
        email: 'support@websparks.ai'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Email',
        description: 'Email sending operations'
      },
      {
        name: 'Jobs',
        description: 'Job management operations'
      },
      {
        name: 'Health',
        description: 'Health and status checks'
      }
    ]
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
};

export const specs = swaggerJsdoc(options);
