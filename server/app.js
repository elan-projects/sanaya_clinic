const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, '../public');

// Extended MIME types for your specific files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.txt': 'text/plain'
};

// Default pages for each route
const defaultPages = {
  '/': '/main.html',
  '/branch': '/branch.html',
  '/contact': '/contact.html',
  '/doctor': '/doctor.html'
};

const server = http.createServer(async (req, res) => {
  try {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // Clean the URL and handle default pages
    const cleanPath = req.url.split('?')[0]; // Remove query parameters
    const requestedPath = defaultPages[cleanPath] || cleanPath;
    const filePath = path.join(PUBLIC_DIR, requestedPath);
    const extname = path.extname(filePath).toLowerCase();

    // Block path traversal attempts
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    // Check if file exists and is accessible
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch (err) {
      // Try with .html extension if no extension provided
      if (!extname) {
        const htmlPath = `${filePath}.html`;
        try {
          await fs.promises.access(htmlPath, fs.constants.R_OK);
          return serveFile(htmlPath, res);
        } catch {
          res.writeHead(404);
          return res.end('Not found');
        }
      }
      res.writeHead(404);
      return res.end('Not found');
    }

    // Serve the file
    serveFile(filePath, res);
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500);
    res.end('Server error');
  }
});

// Helper function to serve files
function serveFile(filePath, res) {
  const extname = path.extname(filePath).toLowerCase();
  const stats = fs.statSync(filePath);

  if (stats.isDirectory()) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  res.setHeader('Content-Type', mimeTypes[extname] || 'text/plain');
  res.setHeader('Content-Length', stats.size);

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    res.writeHead(500);
    res.end('Error loading file');
  });
  stream.pipe(res);
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available pages:');
  console.log('- http://localhost:3000/ (main.html)');
  console.log('- http://localhost:3000/branch (branch.html)');
  console.log('- http://localhost:3000/contact (contact.html)');
  console.log('- http://localhost:3000/doctor (doctor.html)');
});