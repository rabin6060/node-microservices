const express = require('express');
const { AuthenticateMiddleware } = require('../middlewares/authUser');
const { uploadMedia } = require('../controller/media.controller');
const multer = require('multer');
const logger = require('../utils/logger');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single('file');

router.post('/', AuthenticateMiddleware, (req, res, next) => {
    // Check if Content-Type is correct
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) {
        logger.error('Invalid Content-Type for file upload:', contentType);
        return res.status(400).json({ message: 'Invalid Content-Type. Use multipart/form-data' });
    }

    // Handle client disconnection
    req.on('close', () => {
        logger.warn('Client disconnected during file upload');
    });

    // Call multer to handle the upload
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            logger.error(`Multer error: ${err.message}`, err);
            return res.status(400).json({
                message: 'Multer error while uploading',
                error: err.message,
                stack: err.stack
            });
        } else if (err) {
            if (err.message.includes('Unexpected end of form')) {
                logger.error('File upload request was incomplete or aborted', err);
                return res.status(400).json({
                    message: 'File upload was interrupted. Please try again.',
                });
            }
            logger.error(`Unknown upload error: ${err.message}`, err);
            return res.status(500).json({
                message: 'Unknown error occurred while uploading',
                error: err.message,
                stack: err.stack
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        next();
    });
}, uploadMedia);

module.exports = router;
