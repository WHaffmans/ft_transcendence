import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handler } from './build/handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Load SSL certificates
const options = {
	key: fs.readFileSync('/certs/prod/frontend-key.pem'),
	cert: fs.readFileSync('/certs/prod/frontend-cert.pem')
};


// Create HTTPS server
const server = https.createServer(options, handler);

// Start server
server.listen(PORT, HOST, () => {
	console.log(`🔒 HTTPS server running on https://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('SIGTERM received, closing server gracefully...');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	console.log('SIGINT received, closing server gracefully...');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});
