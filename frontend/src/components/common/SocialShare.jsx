import React from 'react';
import { Link2, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { IconButton } from '../ui';

const SocialShare = ({ incident }) => {
    const shareUrl = `${window.location.origin}/incident/${incident._id}`;
    const shareText = `${incident.title} (${incident.type}) on Incident Tracker`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Link copied');
        } catch {
            toast.error('Could not copy the link');
        }
    };

    const nativeShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: 'Incident report', text: shareText, url: shareUrl }); } catch { /* cancelled */ }
        } else {
            copy();
        }
    };

    const open = (url) => window.open(url, '_blank', 'noopener,noreferrer');

    return (
        <div className="flex items-center gap-1">
            <span className="eyebrow mr-2">Share</span>
            <IconButton label="Share" onClick={nativeShare}><Share2 className="h-4 w-4" /></IconButton>
            <button onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`)} className="rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-muted hover:bg-paper-deep hover:text-ink">WhatsApp</button>
            <button onClick={() => open(`https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)} className="rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-muted hover:bg-paper-deep hover:text-ink">X</button>
            <IconButton label="Copy link" onClick={copy}><Link2 className="h-4 w-4" /></IconButton>
        </div>
    );
};

export default SocialShare;
