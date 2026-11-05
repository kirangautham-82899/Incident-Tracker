import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceInput = ({ onTranscript }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
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
            toast.success('Listening... Speak now!');
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-xl border transition-all duration-300 ${isListening
                        ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                        : 'bg-slate-800/50 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                title={isListening ? 'Stop recording' : 'Start voice input'}
            >
                {isListening ? (
                    <MicOff className="w-5 h-5" />
                ) : (
                    <Mic className="w-5 h-5" />
                )}
            </button>

            {isListening && (
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-500/90 backdrop-blur-sm rounded-lg border border-red-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin text-white" />
                        <span className="text-white text-sm font-bold">Recording...</span>
                    </div>
                </div>
            )}

            {transcript && !isListening && (
                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300 font-mono">{transcript}</p>
                </div>
            )}
        </div>
    );
};

export default VoiceInput;
