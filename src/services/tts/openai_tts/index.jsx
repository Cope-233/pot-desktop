import { fetch, Body, ResponseType } from '@tauri-apps/api/http';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:8081/v1/audio/speech';

function normalizeEndpoint(requestPath) {
    let value = (requestPath || DEFAULT_ENDPOINT).trim();
    if (!/^https?:\/\//i.test(value)) {
        value = `http://${value}`;
    }

    const url = new URL(value);
    let path = url.pathname.replace(/\/+$/, '');
    if (!path.endsWith('/audio/speech')) {
        if (path.endsWith('/v1')) {
            path += '/audio/speech';
        } else if (path === '') {
            path = '/v1/audio/speech';
        } else {
            path += '/v1/audio/speech';
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

export async function tts(text, _lang, options = {}) {
    const { config = {} } = options;
    const {
        requestPath = DEFAULT_ENDPOINT,
        model = 'tts-1',
        apiKey = '',
        voice = 'alloy',
        responseFormat = 'wav',
        speed = 1,
        requestArguments = '{}',
    } = config;

    const headers = {
        'Content-Type': 'application/json',
    };
    if (apiKey.trim() !== '') {
        headers.Authorization = `Bearer ${apiKey.trim()}`;
    }

    const body = {
        ...parseRequestArguments(requestArguments),
        model,
        input: text,
        voice,
        response_format: responseFormat,
        speed: Number(speed) || 1,
    };

    const res = await fetch(normalizeEndpoint(requestPath), {
        method: 'POST',
        headers,
        body: Body.json(body),
        responseType: ResponseType.Binary,
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    }

    return res.data;
}

export * from './Config';
export * from './info';
