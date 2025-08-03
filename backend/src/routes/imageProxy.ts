// routes/imageProxy.ts - Proxy route for handling external images (including Google)
import { Router, Request, Response } from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const router = Router();

/**
 * @swagger
 * /api/image-proxy:
 *   get:
 *     summary: Proxy external images to avoid CORS issues
 *     tags: [Utility]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: The external image URL to proxy
 *     responses:
 *       200:
 *         description: Image successfully proxied
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing or invalid URL
 *       500:
 *         description: Failed to fetch image
 */
router.get('/image-proxy', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'URL parameter is required'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL provided'
      });
    }

    // Only allow image domains for security
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

    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname.endsWith(domain)
    );

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Domain not allowed for proxying'
      });
    }

    console.log(`🖼️ Proxying image: ${url}`);

    // Use built-in Node.js modules instead of node-fetch
    const client = urlObj.protocol === 'https:' ? https : http;

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
      timeout: 10000, // 10 second timeout
    };

    const proxyRequest = client.request(options, (proxyResponse) => {
      // Check if response is successful
      if (!proxyResponse.statusCode || proxyResponse.statusCode >= 400) {
        console.error(`Failed to fetch image: ${proxyResponse.statusCode} ${proxyResponse.statusMessage}`);
        return res.status(proxyResponse.statusCode || 500).json({
          success: false,
          message: `Failed to fetch image: ${proxyResponse.statusMessage}`
        });
      }

      // Check if response is actually an image
      const contentType = proxyResponse.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          message: 'URL does not point to a valid image'
        });
      }

      // Set appropriate headers
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      });

      // Stream the image directly to response
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

  } catch (error: any) {
    console.error('Image proxy error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to proxy image'
    });
  }
});

export default router;
