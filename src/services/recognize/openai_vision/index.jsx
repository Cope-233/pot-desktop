import { fetch, Body } from '@tauri-apps/api/http';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:8080/v1/chat/completions';
const DEFAULT_PROMPT =
    'Perform OCR on this image. Return only the recognized text. Preserve paragraph and line breaks where meaningful. Do not translate, summarize, explain, or add markdown fences. Transcribe formulas, punctuation, and symbols faithfully. Preferred language: $lang.';

function normalizeEndpoint(requestPath) {
    let value = (requestPath || DEFAULT_ENDPOINT).trim();
    if (!/^https?:\/\//i.test(value)) {
        value = `http://${value}`;
    }

    const url = new URL(value);
    let path = url.pathname.replace(/\/+$/, '');
    if (!path.endsWith('/chat/completions')) {
        if (path.endsWith('/v1')) {
            path += '/chat/completions';
        } else if (path === '') {
            path = '/v1/chat/completions';
        } else {
            path += '/v1/chat/completions';
        }
    }
    url.pathname = path;
    return url.href;
}

function parseRequestArguments(value) {
    if (!value || value.trim() === '') return {};
    const parsed = JSON.parse(value);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('Request arguments must be a JSON object');
    }
    return parsed;
}

function extractText(data) {
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
        return content
            .map((item) => (typeof item === 'string' ? item : item?.text ?? ''))
            .join('')
            .trim();
    }
    throw new Error(`Invalid OpenAI-compatible response: ${JSON.stringify(data)}`);
}

export async function recognize(base64, lang, options = {}) {
    const { config = {} } = options;
    const {
        requestPath = DEFAULT_ENDPOINT,
        model = '',
        apiKey = '',
        prompt = DEFAULT_PROMPT,
        requestArguments = '{\n  "temperature": 0,\n  "max_tokens": 4096\n}',
    } = config;

    const headers = {
        'Content-Type': 'application/json',
    };
    if (apiKey.trim() !== '') {
        headers.Authorization = `Bearer ${apiKey.trim()}`;
    }

    const body = {
        ...parseRequestArguments(requestArguments),
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: (prompt || DEFAULT_PROMPT).replaceAll('$lang', lang || 'auto'),
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/png;base64,${base64}`,
                        },
                    },
                ],
            },
        ],
        stream: false,
    };

    if (model.trim() !== '') {
        body.model = model.trim();
    }

    const res = await fetch(normalizeEndpoint(requestPath), {
        method: 'POST',
        headers,
        body: Body.json(body),
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    }

    return extractText(res.data);
}

export * from './Config';
export * from './info';
