const DEFAULT_SYSTEM_PROMPT = 'You are a writing assistant. Continue the text naturally. Return only the continuation, without quotes, prefixes, or ellipses (...). Do not repeat the provided existing text.';

const normalizeSuggestion = (text, maxWords) => {
    if (!text) return '';

    // Only remove leadings *newlines*, preserve spaces for inline completion
    let cleaned = text.replace(/^[\r\n]+/, '');

    // Strip leading ellipses or common AI "continuing" markers
    cleaned = cleaned.replace(/^(\s*\.\.\.\s*|\s*-\s*|\s*>\s*)/, '');

    // If we have a word limit, try to cut off cleanly
    if (maxWords) {
        const words = cleaned.split(/\s+/);
        if (words.length > maxWords) {
            cleaned = words.slice(0, maxWords).join(' ');
        }
    }

    return cleaned;
};


// --- GEMINI PROVIDER ---
const requestGemini = async ({ apiKey, model, prefix, suffix, maxWords, signal }) => {
    if (!apiKey) throw new Error('Missing Gemini API key');

    const prompt = `${DEFAULT_SYSTEM_PROMPT}\n\nExisting text:\n${prefix}\n\n[CURSOR]\n\n${suffix}\n\nTask: Continue from [CURSOR].`;
    const safeModel = model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(safeModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Estimate tokens from words (roughly 1.3 tokens per word)
    const maxTokens = Math.max(10, Math.ceil((maxWords || 12) * 2)); // ample buffer

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: maxTokens
            }
        }),
        signal
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini error: ${errText}`);
    }
    const data = await response.json();
    const content = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
        ? data.candidates[0].content.parts.map((p) => p.text || '').join('')
        : '';

    return normalizeSuggestion(content, maxWords);
};

// --- OPENAI PROVIDER ---
const requestOpenAI = async ({ apiKey, model, prefix, suffix, maxWords, signal }) => {
    if (!apiKey) throw new Error('Missing OpenAI API key');

    const prompt = `Existing text:\n${prefix}\n\n[CURSOR]\n\n${suffix}\n\nTask: Continue from [CURSOR].`;
    const maxTokens = Math.max(10, Math.ceil((maxWords || 12) * 2));

    const body = {
        model: model || 'gpt-4o-mini',
        messages: [
            { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: maxTokens
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI error: ${errText}`);
    }

    const data = await response.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '';

    return normalizeSuggestion(content, maxWords);
};

// --- OLLAMA PROVIDER (LOCAL) ---
const requestOllama = async ({ baseUrl, model, prefix, suffix, maxWords, signal }) => {
    const url = (baseUrl || 'http://localhost:11434').replace(/\/$/, '');
    const prompt = `${DEFAULT_SYSTEM_PROMPT}\n\nExisting text:\n${prefix}\n\n[CURSOR]\n\n${suffix}\n\nTask: Continue from [CURSOR].`;

    // Ollama generate endpoint usually works well for completion if prompted right, 
    // or use chat endpoint. Let's use /api/generate for raw completion control if model supports it,
    // otherwise chat. Most local models are chat tuned now. Use chat.

    const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model || 'llama3.1:8b',
            messages: [
                { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            stream: false,
            options: {
                num_predict: Math.max(10, Math.ceil((maxWords || 12) * 2)), // limits output length
                temperature: 0.3
            }
        }),
        signal
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama error: ${errText}`);
    }

    const data = await response.json();
    const content = data && data.message ? data.message.content : '';
    return normalizeSuggestion(content, maxWords);
};


// --- MAIN EXPORT ---
export const requestInlineSuggestion = async ({ aiConfig, prefix, suffix, mode, signal }) => {
    if (!aiConfig || !aiConfig.enabled) return '';

    const provider = aiConfig.provider || 'gemini';
    const maxWords = aiConfig.maxWords || 12; // Default to ~12 words (sentence fragment)

    if (provider === 'gemini') {
        const geminiSettings = aiConfig.gemini || {};
        if (!geminiSettings.apiKey) return '';
        return await requestGemini({
            apiKey: geminiSettings.apiKey,
            model: geminiSettings.model,
            prefix,
            suffix,
            maxWords,
            signal
        });
    }

    if (provider === 'openai') {
        const openaiSettings = aiConfig.openai || {};
        if (!openaiSettings.apiKey) return '';
        return await requestOpenAI({
            apiKey: openaiSettings.apiKey,
            model: openaiSettings.model,
            prefix,
            suffix,
            maxWords,
            signal
        });
    }

    if (provider === 'ollama') {
        const ollamaSettings = aiConfig.ollama || {};
        return await requestOllama({
            baseUrl: ollamaSettings.baseUrl,
            model: ollamaSettings.model,
            prefix,
            suffix,
            maxWords,
            signal
        });
    }

    return '';
};
