import React, { useEffect, useRef, useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import toast from 'react-hot-toast';
import { EASE } from '../ui/motion';
import api, { getErrorMessage } from '../../utils/api';

const MAX_SIZE = 10 * 1024 * 1024;

const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Picks images/videos and uploads them immediately to /api/uploads.
 * Calls onChange(mediaArray) with [{ type, url }] for every uploaded file.
 */
const MediaUpload = ({ value = [], onChange, maxFiles = 5, onUploadingChange }) => {
    const [items, setItems] = useState([]); // { id, name, size, type, preview, status, media }
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);
    // Latest items, readable from async upload callbacks
    const itemsRef = useRef([]);
    const [prevValue, setPrevValue] = useState(value);

    // Parent cleared the form after submit: reset (state adjusted during render)
    if (value !== prevValue) {
        setPrevValue(value);
        if (value.length === 0 && items.some(i => i.status === 'done')) {
            setItems([]);
        }
    }

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => () => itemsRef.current.forEach(i => URL.revokeObjectURL(i.preview)), []);

    const publish = (next) => {
        itemsRef.current = next;
        setItems(next);
        onChange?.(next.filter(i => i.status === 'done').map(i => i.media));
        onUploadingChange?.(next.some(i => i.status === 'uploading'));
    };

    // Preferred: get a one-time signed URL and send the file straight to Supabase Storage.
    // Falls back to uploading through the API when the server has no Supabase Storage.
    const uploadOne = async (item) => {
        try {
            const sign = await api.post('/uploads/sign', {
                files: [{ name: item.name, type: item.type, size: item.size }]
            });
            if (sign.data.mode === 'direct') {
                const target = sign.data.data[0];
                const body = new FormData();
                body.append('cacheControl', '3600');
                body.append('', item.file);
                const res = await fetch(target.signedUrl, { method: 'PUT', body, headers: { 'x-upsert': 'false' } });
                if (!res.ok) throw new Error(`storage responded ${res.status}`);
                return { ...item, status: 'done', media: { type: target.type, url: target.url } };
            }

            const form = new FormData();
            form.append('files', item.file);
            const res = await api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            return { ...item, status: 'done', media: res.data.data[0] };
        } catch (error) {
            toast.error(`${item.name}: ${getErrorMessage(error, 'upload failed')}`);
            return { ...item, status: 'error' };
        }
    };

    const handleFiles = async (fileList) => {
        const files = Array.from(fileList).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (files.length === 0) {
            toast.error('Only images and videos can be attached');
            return;
        }
        const tooBig = files.filter(f => f.size > MAX_SIZE);
        if (tooBig.length) toast.error(`${tooBig.map(f => f.name).join(', ')} is larger than 10MB`);
        const accepted = files.filter(f => f.size <= MAX_SIZE).slice(0, maxFiles - itemsRef.current.length);
        if (accepted.length === 0) {
            if (!tooBig.length) toast.error(`Maximum ${maxFiles} files`);
            return;
        }

        const newItems = accepted.map(file => ({
            id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: URL.createObjectURL(file),
            status: 'uploading'
        }));
        publish([...itemsRef.current, ...newItems]);

        const results = await Promise.all(newItems.map(uploadOne));
        const byId = Object.fromEntries(results.map(r => [r.id, r]));
        publish(itemsRef.current.map(i => byId[i.id] || i).filter(i => i.status !== 'error'));
    };

    const removeItem = (id) => {
        const item = itemsRef.current.find(i => i.id === id);
        if (item) URL.revokeObjectURL(item.preview);
        publish(itemsRef.current.filter(i => i.id !== id));
    };

    const onDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const full = items.length >= maxFiles;

    return (
        <div className="space-y-4">
            {!full && (
                <div
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-colors duration-200 ${dragActive ? 'border-ink bg-paper-deep' : 'border-line-strong hover:border-ink-muted hover:bg-paper-deep/50'}`}
                    onDragEnter={onDrag}
                    onDragLeave={onDrag}
                    onDragOver={onDrag}
                    onDrop={(e) => { onDrag(e); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
                    />
                    <motion.span animate={{ y: dragActive ? -4 : 0 }} className="mb-3 text-ink-muted">
                        <Upload className="h-5 w-5" />
                    </motion.span>
                    <p className="text-sm font-medium">{dragActive ? 'Drop to attach' : 'Drop photos or videos, or click to browse'}</p>
                    <p className="mt-1 text-[13px] text-ink-muted">Up to {maxFiles} files · 10 MB each</p>
                </div>
            )}

            {items.length > 0 && (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    <AnimatePresence initial={false}>
                        {items.map((item) => (
                            <motion.li
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, ease: EASE }}
                                className="group relative"
                            >
                                <div className="relative aspect-square overflow-hidden rounded-xl bg-paper-deep">
                                    {item.type.startsWith('image/') ? (
                                        <img src={item.preview} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <video src={item.preview} className="h-full w-full object-cover" muted />
                                    )}
                                    {item.status === 'uploading' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-paper/70 backdrop-blur-[1px]">
                                            <Loader className="h-5 w-5 animate-spin text-ink" />
                                        </div>
                                    )}
                                </div>
                                <p className="mt-1.5 truncate text-[12px] text-ink-muted">{formatFileSize(item.size)}</p>
                                {item.status !== 'uploading' && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        aria-label={`Remove ${item.name}`}
                                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-paper opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            )}
        </div>
    );
};

export default MediaUpload;
