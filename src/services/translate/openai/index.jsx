import { fetch, Body } from '@tauri-apps/api/http';
import { Language } from './info';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:8080/v1/chat/completions';
const DEFAULT_REQUEST_ARGUMENTS = {
    temperature: 0.1,
    top_p: 0.99,
    frequency_penalty: 0,
    presence_penalty: 0,
};
const DEFAULT_PROMPT_LIST = [
    {
        role: 'system',
        content:
            'You are a professional translation engine. Translate faithfully and fluently. Return only the translated text without explanation, notes, or markdown.',
    },
    { role: 'user', content: 'Translate from $from to $to:\n"""\n$text\n"""' },
];

function normalizeEndpoint(requestPath) {
    let value = (requestPath || DEFAULT_ENDPOINT).trim();
    if (!/^https?:\/\//i.test(value)) {
        value = `http://${value}`;
    }

    const url = new URL(value);
    let path = url.pathname.replace(/\/+$/, '');
    if (!path.endsWith('/chat/completions')) {
        if (path === '' || path === '/') {
            path = '/v1/chat/completions';
        } else if (path.endsWith('/v1')) {
            path += '/chat/completions';
        } else {
            path += '/v1/chat/completions';
        }
    }
    url.pathname = path;
    return url.href;
}

function parseRequestArguments(value) {
    if (value === undefined || value === null || value === '') return { ...DEFAULT_REQUEST_ARGUMENTS };
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('Request arguments must be a JSON object');
    }
    return parsed;
}

function messageContentToText(content) {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content.map((item) => (typeof item === 'string' ? item : item?.text ?? '')).join('');
    }
    return '';
}

function buildMessages(promptList, text, from, to, detect) {
    const detectedLanguage = Language[detect] ?? detect ?? 'Auto';
    const prompts = Array.isArray(promptList) && promptList.length > 0 ? promptList : DEFAULT_PROMPT_LIST;
    return prompts.map((item) => ({
        ...item,
        content: String(item.content ?? '')
            .replaceAll('$text', text)
            .replaceAll('$from', from)
            .replaceAll('$to', to)
            .replaceAll('$detect', detectedLanguage),
    }));
}

function buildHeaders(apiKey) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey?.trim()) {
        headers.Authorization = `Bearer ${apiKey.trim()}`;
    }
    return headers;
}

function appendStreamDelta(data, target) {
    const delta = messageContentToText(data?.choices?.[0]?.delta?.content);
    return delta ? target + delta : target;
}

export async function translate(text, from, to, options = {}) {
    const { config = {}, setResult, detect } = options;
    const {
        requestPath = DEFAULT_ENDPOINT,
        model = '',
        apiKey = '',
        stream = true,
        promptList = DEFAULT_PROMPT_LIST,
        requestArguments,
    } = config;

    const apiUrl = normalizeEndpoint(requestPath);
    const body = {
        ...parseRequestArguments(requestArguments),
        stream: Boolean(stream),
        messages: buildMessages(promptList, text, from, to, detect),
    };
    if (model?.trim()) {
        body.model = model.trim();
    }

    const headers = buildHeaders(apiKey);

    if (stream) {
        const res = await window.fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }
        if (!res.body) {
            throw new Error('Streaming response has no body');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let target = '';

        const consumeLine = (line) => {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) return false;
            const payload = trimmed.slice(5).trim();
            if (payload === '' || payload === '[DONE]') return payload === '[DONE]';
            const data = JSON.parse(payload);
            target = appendStreamDelta(data, target);
            if (setResult && target !== '') {
                setResult(target + '_');
            }
            return false;
        };

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() ?? '';
                let finished = false;
                for (const line of lines) {
                    if (consumeLine(line)) {
                        finished = true;
                        break;
                    }
                }
                if (finished) break;
            }
            buffer += decoder.decode();
            if (buffer.trim() !== '') {
                try {
                    consumeLine(buffer);
                } catch {
                    // Ignore a trailing incomplete SSE fragment after the stream closes.
                }
            }
        } finally {
            reader.releaseLock();
        }

        const result = target.trim();
        if (setResult) setResult(result);
        return result;
    }

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: Body.json(body),
    });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    }

    const target = messageContentToText(res.data?.choices?.[0]?.message?.content).trim();
    if (target === '') {
        throw new Error(`Invalid OpenAI-compatible response: ${JSON.stringify(res.data)}`);
    }
    return target;
}

export * from './Config';
export * from './info';
