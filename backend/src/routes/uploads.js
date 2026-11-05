import express from 'express';
import { upload, uploadMedia, signUploads } from '../controllers/uploadController.js';

const router = express.Router();

// Preferred: browser uploads directly to Supabase Storage with a signed URL
router.post('/sign', signUploads);
// Fallback (local dev without Supabase): multipart upload through the API
router.post('/', upload.array('files', 5), uploadMedia);

export default router;
