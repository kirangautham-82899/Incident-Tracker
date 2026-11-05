import express from 'express';
import { upload, uploadMedia, signUploads } from '../controllers/uploadController.js';
import { limits } from '../middleware/rateLimit.js';

const router = express.Router();

// Preferred: browser uploads directly to Supabase Storage with a signed URL
router.post('/sign', limits.upload, signUploads);
// Fallback (local dev without Supabase): multipart upload through the API
router.post('/', limits.upload, upload.array('files', 5), uploadMedia);

export default router;
