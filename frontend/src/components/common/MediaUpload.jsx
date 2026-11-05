import React, { useEffect, useRef, useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
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

    const uploadOne = async (item) => {
        const form = new FormData();
        form.append('files', item.file);
        try {
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

    return (
        <div className="space-y-3">
            <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 bg-slate-900/50 hover:border-white/40'}`}
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
                <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-blue-400' : 'text-gray-400'}`} />
                <p className="text-sm font-bold text-white">Add photos or videos</p>
                <p className="text-xs text-gray-400">Drag and drop or click · up to {maxFiles} files, 10MB each</p>
            </div>

            {items.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {items.map((item) => (
                        <div key={item.id} className="relative">
                            <div className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-white/10 relative">
                                {item.type.startsWith('image/') ? (
                                    <img src={item.preview} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <video src={item.preview} className="w-full h-full object-cover" muted />
                                )}
                                {item.status === 'uploading' && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate mt-1">{item.name}</p>
                            <p className="text-[11px] text-gray-500">{formatFileSize(item.size)}</p>
                            {item.status !== 'uploading' && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    aria-label={`Remove ${item.name}`}
                                    className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full shadow-lg"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaUpload;
