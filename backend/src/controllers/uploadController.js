import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

const cloudinaryConfigured = () =>
    Boolean(process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name');

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new ApiError(400, 'Only image and video files are allowed'));
        }
    }
});

const uploadToCloudinary = (file) => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
        { folder: 'incident-tracker', resource_type: 'auto' },
        (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(file.buffer);
});

const saveLocally = async (file, req) => {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 8);
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
    const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    return `${base}/uploads/${name}`;
};

// @desc    Upload incident media (images/videos)
// @route   POST /api/uploads
// @access  Public (anonymous reporters can attach evidence too)
export const uploadMedia = asyncHandler(async (req, res) => {
    const files = req.files || [];
    if (files.length === 0) {
        throw new ApiError(400, 'No files uploaded');
    }

    const useCloudinary = cloudinaryConfigured();
    // Serverless hosts have no persistent disk: local storage would silently lose files
    if (!useCloudinary && process.env.VERCEL) {
        throw new ApiError(501, 'Media uploads are not configured on this server (set the CLOUDINARY_* variables)');
    }
    if (useCloudinary) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }

    const media = [];
    for (const file of files) {
        const url = useCloudinary ? await uploadToCloudinary(file) : await saveLocally(file, req);
        media.push({
            type: file.mimetype.startsWith('video/') ? 'video' : 'image',
            url
        });
    }

    res.status(201).json({
        success: true,
        storage: useCloudinary ? 'cloudinary' : 'local',
        data: media
    });
});
