import express from 'express';
import { upload, uploadMedia } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/', upload.array('files', 5), uploadMedia);

export default router;
