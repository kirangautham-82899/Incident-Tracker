import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET || 'incident-media';

const supabaseConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let supabase = null;
let bucketReady = null;

const getSupabase = () => {
    if (!supabase) {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
    }
    return supabase;
};

// Create the public bucket on first use if it does not exist yet
const ensureBucket = () => {
    if (!bucketReady) {
        bucketReady = (async () => {
            const client = getSupabase();
            const { data } = await client.storage.getBucket(BUCKET());
            if (!data) {
                const { error } = await client.storage.createBucket(BUCKET(), {
                    public: true,
                    fileSizeLimit: MAX_FILE_SIZE,
                    allowedMimeTypes: ['image/*', 'video/*']
                });
                if (error && !/already exists/i.test(error.message)) throw error;
            }
        })().catch((err) => {
            bucketReady = null;
            throw err;
        });
    }
    return bucketReady;
};

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

const fileName = (file) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 8);
    return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
};

const uploadToSupabase = async (file) => {
    await ensureBucket();
    const client = getSupabase();
    const objectPath = `incidents/${new Date().toISOString().slice(0, 10)}/${fileName(file)}`;
    const { error } = await client.storage.from(BUCKET()).upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
    });
    if (error) throw new ApiError(502, `Upload failed: ${error.message}`);
    return client.storage.from(BUCKET()).getPublicUrl(objectPath).data.publicUrl;
};

const saveLocally = async (file, req) => {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    const name = fileName(file);
    await fs.promises.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
    const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    return `${base}/uploads/${name}`;
};

// @desc    Get one-time signed URLs so the browser uploads straight to Supabase Storage
//          (avoids serverless request-size limits). Falls back to `mode: multipart`
//          when Supabase Storage isn't configured.
// @route   POST /api/uploads/sign   body: { files: [{ name, type, size }] }
// @access  Public (anonymous reporters can attach evidence too)
export const signUploads = asyncHandler(async (req, res) => {
    if (!supabaseConfigured()) {
        return res.status(200).json({ success: true, mode: 'multipart' });
    }

    const files = Array.isArray(req.body.files) ? req.body.files : [];
    if (files.length === 0) throw new ApiError(400, 'No files to upload');
    if (files.length > MAX_FILES) throw new ApiError(400, `Maximum ${MAX_FILES} files`);
    for (const f of files) {
        const type = String(f?.type || '');
        if (!type.startsWith('image/') && !type.startsWith('video/')) {
            throw new ApiError(400, 'Only image and video files are allowed');
        }
        if (!(Number(f.size) > 0) || Number(f.size) > MAX_FILE_SIZE) {
            throw new ApiError(400, 'File too large (max 10MB)');
        }
    }

    await ensureBucket();
    const storage = getSupabase().storage.from(BUCKET());
    const data = [];
    for (const f of files) {
        const objectPath = `incidents/${new Date().toISOString().slice(0, 10)}/${fileName({ originalname: String(f.name || 'file') })}`;
        const { data: signed, error } = await storage.createSignedUploadUrl(objectPath);
        if (error) throw new ApiError(502, `Could not prepare upload: ${error.message}`);
        data.push({
            type: String(f.type).startsWith('video/') ? 'video' : 'image',
            signedUrl: signed.signedUrl,
            url: storage.getPublicUrl(objectPath).data.publicUrl
        });
    }

    res.status(200).json({ success: true, mode: 'direct', data });
});

// @desc    Upload incident media (images/videos)
// @route   POST /api/uploads
// @access  Public (anonymous reporters can attach evidence too)
export const uploadMedia = asyncHandler(async (req, res) => {
    const files = req.files || [];
    if (files.length === 0) {
        throw new ApiError(400, 'No files uploaded');
    }

    const useSupabase = supabaseConfigured();
    // Serverless hosts have no persistent disk: local storage would silently lose files
    if (!useSupabase && process.env.VERCEL) {
        throw new ApiError(501, 'Media uploads are not configured on this server (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
    }

    const media = [];
    for (const file of files) {
        const url = useSupabase ? await uploadToSupabase(file) : await saveLocally(file, req);
        media.push({ type: file.mimetype.startsWith('video/') ? 'video' : 'image', url });
    }

    res.status(201).json({
        success: true,
        storage: useSupabase ? 'supabase' : 'local',
        data: media
    });
});
