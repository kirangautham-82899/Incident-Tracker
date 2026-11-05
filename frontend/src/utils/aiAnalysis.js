/**
 * AI-Powered Incident Analysis
 * Smart categorization, urgency detection, and duplicate prevention
 */

// Whole-word match so "hit" does not match "white"
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchesWord = (text, keyword) => new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(text);

// Urgency keywords by severity
const URGENCY_KEYWORDS = {
    critical: ['emergency', 'urgent', 'critical', 'fatal', 'severe', 'life-threatening', 'danger', 'immediate'],
    high: ['serious', 'major', 'significant', 'important', 'quickly', 'asap', 'help'],
    medium: ['moderate', 'concerning', 'attention', 'issue', 'problem'],
    low: ['minor', 'small', 'slight', 'little']
};

// Type detection keywords
const TYPE_KEYWORDS = {
    fire: ['fire', 'smoke', 'burning', 'flames', 'blaze', 'combustion', 'arson'],
    medical: ['injured', 'hurt', 'unconscious', 'bleeding', 'ambulance', 'medical', 'heart attack', 'stroke', 'pain'],
    accident: ['accident', 'crash', 'collision', 'vehicle', 'car', 'truck', 'motorcycle', 'hit'],
    infrastructure: ['road', 'bridge', 'building', 'power', 'water', 'gas', 'leak', 'outage', 'damage'],
    safety: ['robbery', 'theft', 'assault', 'violence', 'suspicious', 'crime', 'threat']
};

/**
 * Analyze incident description for urgency level
 */
export const analyzeUrgency = (description) => {
    if (!description) return 'low';

    const text = description.toLowerCase();
    let scores = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    };

    // Count keyword matches
    Object.entries(URGENCY_KEYWORDS).forEach(([level, keywords]) => {
        keywords.forEach(keyword => {
            if (matchesWord(text, keyword)) {
                scores[level]++;
            }
        });
    });

    // Detect exclamation marks (indicates urgency)
    const exclamationCount = (description.match(/!/g) || []).length;
    if (exclamationCount >= 2) scores.critical += 2;
    else if (exclamationCount === 1) scores.high += 1;

    // Detect all caps words (shouting/urgency)
    const capsWords = description.match(/\b[A-Z]{3,}\b/g) || [];
    if (capsWords.length >= 2) scores.critical += 1;
    else if (capsWords.length === 1) scores.high += 1;

    // Return highest scoring level
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'medium'; // Default

    return Object.keys(scores).find(key => scores[key] === maxScore);
};

/**
 * Suggest incident type based on description
 */
export const suggestIncidentType = (description) => {
    if (!description) return null;

    const text = description.toLowerCase();
    let scores = {};

    // Score each type based on keyword matches
    Object.entries(TYPE_KEYWORDS).forEach(([type, keywords]) => {
        let score = 0;
        keywords.forEach(keyword => {
            if (matchesWord(text, keyword)) {
                score++;
            }
        });
        if (score > 0) {
            scores[type] = score;
        }
    });

    // Return type with highest score, or null if no matches
    if (Object.keys(scores).length === 0) return null;

    const maxScore = Math.max(...Object.values(scores));
    return Object.keys(scores).find(key => scores[key] === maxScore);
};

/**
 * Calculate similarity between two strings (for duplicate detection)
 */
const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;

    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;

    return commonWords.length / totalWords;
};

/**
 * Detect potential duplicate incidents
 */
export const detectDuplicates = (newIncident, existingIncidents) => {
    const duplicates = [];

    existingIncidents.forEach(incident => {
        // Check if same type
        if (incident.type !== newIncident.type) return;

        // Check if within 2 hours
        const timeDiff = Math.abs(new Date(incident.createdAt) - Date.now()) / (1000 * 60 * 60);
        if (timeDiff > 2) return;

        // Check description similarity
        const similarity = calculateSimilarity(incident.description, newIncident.description);
        if (similarity > 0.5) {
            duplicates.push({
                incident,
                similarity: (similarity * 100).toFixed(0)
            });
        }
    });

    return duplicates.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Calculate AI-enhanced priority score
 */
export const calculateAIPriority = (incident) => {
    let score = 0;

    // Base type priority
    const typePriority = {
        fire: 10,
        medical: 9,
        accident: 7,
        infrastructure: 5,
        safety: 6,
        other: 3
    };
    score += typePriority[incident.type] || 5;

    // Urgency from AI analysis
    const urgency = analyzeUrgency(incident.description);
    const urgencyBonus = {
        critical: 10,
        high: 6,
        medium: 3,
        low: 0
    };
    score += urgencyBonus[urgency] || 3;

    // Verification count
    score += Math.min((incident.verificationCount || 0) * 2, 10);

    // Time factor (older = more urgent)
    const hoursSince = (Date.now() - new Date(incident.createdAt)) / (1000 * 60 * 60);
    score += Math.min(hoursSince * 0.5, 5);

    return Math.round(score);
};

/**
 * Generate incident insights
 */
export const generateInsights = (incident) => {
    const urgency = analyzeUrgency(incident.description);
    const suggestedType = suggestIncidentType(incident.description);
    const aiPriority = calculateAIPriority(incident);

    return {
        urgency,
        suggestedType,
        aiPriority,
        confidence: suggestedType ? 'high' : 'medium',
        insights: [
            urgency === 'critical' && '⚠️ High urgency detected in description',
            suggestedType && suggestedType !== incident.type && `💡 Suggested type: ${suggestedType}`,
            aiPriority > 15 && '🔴 High priority - requires immediate attention'
        ].filter(Boolean)
    };
};

export default {
    analyzeUrgency,
    suggestIncidentType,
    detectDuplicates,
    calculateAIPriority,
    generateInsights
};
