import React from 'react';
import { Share2, Link2, Twitter, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SocialShare = ({ incident, compact = false }) => {
    const shareUrl = `${window.location.origin}/incident/${incident._id}`;
    const shareText = `Check out this incident report: ${incident.title} - ${incident.type.toUpperCase()}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
    };

    const handleTwitterShare = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
    };

    const handleWhatsAppShare = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Native Web Share API (Mobile)
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Incident Report',
                    text: shareText,
                    url: shareUrl,
                });
            } catch {
                console.log('Share canceled');
            }
        } else {
            handleCopyLink();
        }
    };

    if (compact) {
        return (
            <button
                onClick={handleNativeShare}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
                title="Share Incident"
            >
                <Share2 className="w-4 h-4" />
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Share:</span>

            <button
                onClick={handleTwitterShare}
                className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                title="Share on Twitter"
            >
                <Twitter className="w-4 h-4" />
            </button>

            <button
                onClick={handleWhatsAppShare}
                className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                title="Share on WhatsApp"
            >
                <MessageCircle className="w-4 h-4" />
            </button>

            <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-gray-300 transition-colors"
                title="Copy Link"
            >
                <Link2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export default SocialShare;
