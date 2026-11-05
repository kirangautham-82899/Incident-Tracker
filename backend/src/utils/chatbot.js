/**
 * AI Chatbot for Incident Tracker
 * Provides automated responses to user queries
 */

class Chatbot {
    constructor() {
        this.responses = {
            greetings: [
                "Hello! I'm the Incident Tracker AI Assistant. How can I help you today?",
                "Hi there! Need help with reporting an incident or have questions?",
                "Welcome! I'm here to assist you with any questions about incident reporting."
            ],
            reportHelp: [
                "To report an incident, click the 'Report Incident' button on the dashboard. Fill in the details including type, location, and description. Our AI will analyze it for urgency!",
                "Reporting is easy! Just provide the incident type, exact location, severity level, and a detailed description. You can even attach photos!",
                "Need to report something? Go to the Report page, select the incident type (Fire, Medical, Accident, etc.), add location details, and submit. We'll handle it from there!"
            ],
            status: [
                "You can check incident status on the Dashboard or Analytics page. Each incident shows real-time updates!",
                "To track your incidents, visit your Profile page. You'll see all reports you've submitted with their current status.",
                "All incidents are updated in real-time. Check the dashboard for the latest status of any reported incident."
            ],
            emergency: [
                "🚨 For life-threatening emergencies, please call emergency services (911) immediately! This platform is for reporting and tracking, not emergency dispatch.",
                "⚠️ IMPORTANT: In case of immediate danger, call emergency services right away. Use this platform to document and track incidents after ensuring safety.",
                "For urgent emergencies requiring immediate response, dial emergency services. You can report here for documentation and follow-up."
            ],
            features: [
                "Our platform has AI-powered incident analysis, real-time updates, interactive maps, gamification badges, and push notifications!",
                "Key features: 📊 Live Analytics, 🗺️ Interactive Maps, 🤖 AI Analysis, 🏅 Achievement Badges, 💬 Comments & Social Features, 📱 PWA Support!",
                "You can report incidents, track them on an interactive map, earn badges for contributions, view analytics, and get real-time notifications!"
            ],
            map: [
                "The Interactive Map shows all reported incidents with clustering and heat map visualization. Click any marker to see incident details!",
                "Our map feature displays incidents geographically. You can toggle heat maps, see clusters, and click markers for more info. Visit the Map page!",
                "Check out the Map page to visualize incidents by location. It includes real-time updates, custom markers by severity, and clustering for dense areas."
            ],
            badges: [
                "Earn badges by reporting verified incidents! Start as a Rookie Reporter, become an Active Contributor at 5 reports, a Community Hero at 20 and a Legend at 50! 🏆",
                "The gamification system rewards contributors with badges and reputation points. More verified reports = higher status and special privileges!",
                "Your achievements are shown on your Profile page. Report incidents, get them verified, and climb the leaderboard to earn exclusive badges!"
            ],
            thanks: [
                "You're welcome! Feel free to ask if you need more help! 😊",
                "Happy to help! Don't hesitate to reach out if you have more questions!",
                "My pleasure! I'm here 24/7 if you need assistance!"
            ],
            default: [
                "I'm here to help with incident reporting, tracking, and platform features. Ask me about how to report incidents, check status, or use our features!",
                "Not sure I understand that question. I can help with: reporting incidents, checking status, map features, badges, and more. What would you like to know?",
                "Let me know what you need help with! I can assist with incident reports, platform features, tracking, and general questions."
            ]
        };

        this.keywords = {
            greetings: ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
            reportHelp: ['report', 'how to report', 'submit', 'create incident', 'how do i', 'reporting'],
            status: ['status', 'check', 'track', 'where is', 'update', 'progress'],
            emergency: ['emergency', 'urgent', '911', 'help', 'dangerous', 'critical', 'life threatening'],
            features: ['what can', 'features', 'capabilities', 'what does', 'can you', 'functions'],
            map: ['map', 'location', 'where', 'geographic', 'visualization'],
            badges: ['badge', 'achievement', 'reward', 'gamification', 'leaderboard', 'points'],
            thanks: ['thank', 'thanks', 'appreciate', 'helpful']
        };
    }

    generateResponse(message) {
        const lowerMessage = message.toLowerCase();

        // Check for exact matches first
        for (const [category, keywords] of Object.entries(this.keywords)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                const responses = this.responses[category];
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }

        // Default response
        const defaultResponses = this.responses.default;
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    shouldRespond(message, senderRole) {
        if (!message || message.trim().length < 2) return false;
        const text = message.toLowerCase();
        // Always answer when addressed directly
        if (text.includes('@bot') || text.includes('assistant')) return true;
        // Staff use the chat to coordinate; don't interrupt them
        if (senderRole === 'admin' || senderRole === 'responder') return false;
        // Answer citizens' questions, greetings and emergency keywords
        return text.includes('?') ||
            this.keywords.greetings.some(k => text.startsWith(k)) ||
            this.keywords.emergency.some(k => text.includes(k));
    }

    createBotMessage(responseText) {
        return {
            id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: responseText,
            sender: {
                name: 'AI Assistant',
                role: 'bot'
            },
            timestamp: new Date().toISOString()
        };
    }
}

export default new Chatbot();
