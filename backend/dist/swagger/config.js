"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.specs = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const config_1 = require("../config");
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
                url: `http://localhost:${config_1.config.port}`,
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
    apis: ['./src/routes/*.ts'],
};
exports.specs = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=config.js.map
