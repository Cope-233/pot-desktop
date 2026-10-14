import { getServiceName, whetherPluginService } from './service_instance';

export type LocalServiceType = 'translate' | 'recognize' | 'tts';

export const LOCAL_BUILTIN_SERVICES: Record<LocalServiceType, string[]> = {
    translate: ['openai'],
    recognize: ['system', 'openai_vision'],
    tts: ['openai_tts'],
};

export const LOCAL_SERVICE_DEFAULTS: Record<LocalServiceType, string[]> = {
    translate: ['openai'],
    recognize: ['system'],
    tts: ['openai_tts'],
};

export function isLocalBuiltinService(serviceName: string, type: LocalServiceType): boolean {
    return LOCAL_BUILTIN_SERVICES[type].includes(serviceName);
}

export function sanitizeLocalServiceList(serviceInstanceList: unknown, type: LocalServiceType): string[] {
    const list = Array.isArray(serviceInstanceList) ? serviceInstanceList : [];
    const filtered = list.filter((instanceKey) => {
        if (typeof instanceKey !== 'string') return false;
        return whetherPluginService(instanceKey) || isLocalBuiltinService(getServiceName(instanceKey), type);
    });

    return filtered.length > 0 ? filtered : [...LOCAL_SERVICE_DEFAULTS[type]];
}

export function serviceListsEqual(left: string[], right: string[]): boolean {
    return left.length === right.length && left.every((item, index) => item === right[index]);
}
