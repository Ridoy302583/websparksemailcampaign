"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const url_1 = require("url");
const router = (0, express_1.Router)();
router.get('/image-proxy', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'URL parameter is required'
            });
        }
        try {
            new url_1.URL(url);
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL provided'
            });
        }
        const allowedDomains = [
            'googleusercontent.com',
            'googleapis.com',
            'google.com',
            'gstatic.com',
            'github.com',
            'githubusercontent.com',
            'gravatar.com',
            'linkedin.com',
            'licdn.com'
        ];
        const urlObj = new url_1.URL(url);
        const isAllowed = allowedDomains.some(domain => urlObj.hostname.endsWith(domain));
        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                message: 'Domain not allowed for proxying'
            });
        }
        console.log(`🖼️ Proxying image: ${url}`);
        const client = urlObj.protocol === 'https:' ? https_1.default : http_1.default;
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
            },
            timeout: 10000,
        };
        const proxyRequest = client.request(options, (proxyResponse) => {
            if (!proxyResponse.statusCode || proxyResponse.statusCode >= 400) {
                console.error(`Failed to fetch image: ${proxyResponse.statusCode} ${proxyResponse.statusMessage}`);
                return res.status(proxyResponse.statusCode || 500).json({
                    success: false,
                    message: `Failed to fetch image: ${proxyResponse.statusMessage}`
                });
            }
            const contentType = proxyResponse.headers['content-type'];
            if (!contentType || !contentType.startsWith('image/')) {
                return res.status(400).json({
                    success: false,
                    message: 'URL does not point to a valid image'
                });
            }
            res.set({
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
            });
            proxyResponse.pipe(res);
            proxyResponse.on('end', () => {
                console.log(`✅ Successfully proxied image: ${url}`);
            });
        });
        proxyRequest.on('error', (error) => {
            console.error('Proxy request error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });
        proxyRequest.on('timeout', () => {
            console.error('Proxy request timeout');
            proxyRequest.destroy();
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: 'Request timeout'
                });
            }
        });
        proxyRequest.end();
    }
    catch (error) {
        console.error('Image proxy error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to proxy image'
        });
    }
});
exports.default = router;
//# sourceMappingURL=imageProxy.js.map
