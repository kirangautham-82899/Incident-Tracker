import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceInput = ({ onTranscript }) => {
    const [isListening, setIsListening] = useState(false);
    const [, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check if browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPart = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcriptPart + ' ';
                    } else {
                        interimTranscript += transcriptPart;
                    }
                }

                setTranscript(finalTranscript || interimTranscript);
                if (finalTranscript && onTranscript) {
                    onTranscript(finalTranscript.trim());
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                toast.error('Voice input error. Please try again.');
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onTranscript]);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast.error('Voice input not supported in this browser');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
                    }
    };

    return (
        <button
            type="button"
            onClick={toggleListening}
            aria-pressed={isListening}
            title={isListening ? 'Stop voice input' : 'Dictate with your voice'}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${isListening
                ? 'bg-signal text-white'
                : 'text-ink-muted ring-1 ring-inset ring-line-strong hover:text-ink hover:ring-ink'}`}
        >
            {isListening ? (
                <>
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inset-0 animate-pulse-dot rounded-full bg-white" />
                        <span className="relative h-2 w-2 rounded-full bg-white" />
                    </span>
                    Listening… tap to stop
                    <MicOff className="h-3.5 w-3.5" />
                </>
            ) : (
                <>
                    <Mic className="h-3.5 w-3.5" /> Dictate
                </>
            )}
        </button>
    );
};

export default VoiceInput;
