import { Input, Button, Switch, Textarea } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';

import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { translate } from './index';
import { Language, info } from './info';

export const defaultRequestArguments = JSON.stringify(
    {
        temperature: 0.1,
        top_p: 0.99,
        frequency_penalty: 0,
        presence_penalty: 0,
    },
    null,
    2
);

const defaultPromptList = [
    {
        role: 'system',
        content:
            'You are a professional translation engine. Translate faithfully and fluently. Return only the translated text without explanation, notes, or markdown.',
    },
    { role: 'user', content: 'Translate from $from to $to:\n"""\n$text\n"""' },
];

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const toastStyle = useToastStyle();
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: info.displayName,
            requestPath: 'http://127.0.0.1:8080/v1/chat/completions',
            model: '',
            apiKey: '',
            stream: true,
            promptList: defaultPromptList,
            requestArguments: defaultRequestArguments,
        },
        { sync: false }
    );

    useEffect(() => {
        if (!config) return;
        let next = { ...config };
        let changed = false;

        if (next.requestPath === 'https://api.openai.com/v1/chat/completions') {
            next.requestPath = 'http://127.0.0.1:8080/v1/chat/completions';
            changed = true;
        }
        if (next.model === 'gpt-3.5-turbo') {
            next.model = '';
            changed = true;
        }
        if (!Array.isArray(next.promptList) || next.promptList.length === 0) {
            next.promptList = defaultPromptList;
            changed = true;
        }
        if (next.requestArguments === undefined) {
            next.requestArguments = defaultRequestArguments;
            changed = true;
        }
        if (!next[INSTANCE_NAME_CONFIG_KEY] || next[INSTANCE_NAME_CONFIG_KEY] === 'OpenAI') {
            next[INSTANCE_NAME_CONFIG_KEY] = info.displayName;
            changed = true;
        }
        if ('service' in next) {
            delete next.service;
            changed = true;
        }

        if (changed) setConfig(next);
    }, [config]);

    const update = (key, value) => setConfig({ ...config, [key]: value });

    return (
        config !== null && (
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setIsLoading(true);
                    translate('hello', Language.auto, Language.zh_cn, { config }).then(
                        () => {
                            setIsLoading(false);
                            setConfig(config, true);
                            updateServiceList(instanceKey);
                            onClose();
                        },
                        (error) => {
                            setIsLoading(false);
                            toast.error(t('config.service.test_failed') + ': ' + error.toString(), { style: toastStyle });
                        }
                    );
                }}
            >
                <Toaster />
                <div className='config-item'>
                    <Input
                        label={t('services.instance_name')}
                        labelPlacement='outside-left'
                        value={config[INSTANCE_NAME_CONFIG_KEY] ?? info.displayName}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => update(INSTANCE_NAME_CONFIG_KEY, value)}
                    />
                </div>
                <div className='config-item'>
                    <Switch
                        isSelected={config.stream ?? true}
                        onValueChange={(value) => update('stream', value)}
                        classNames={{ base: 'flex flex-row-reverse justify-between w-full max-w-full' }}
                    >
                        {t('services.translate.openai.stream')}
                    </Switch>
                </div>
                <div className='config-item'>
                    <Input
                        label='OpenAI-compatible Endpoint'
                        labelPlacement='outside-left'
                        value={config.requestPath ?? ''}
                        variant='bordered'
                        placeholder='http://127.0.0.1:8080/v1/chat/completions'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => update('requestPath', value)}
                    />
                </div>
                <div className='config-item'>
                    <Input
                        label='Model / alias'
                        labelPlacement='outside-left'
                        value={config.model ?? ''}
                        variant='bordered'
                        placeholder='Optional for llama.cpp'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => update('model', value)}
                    />
                </div>
                <div className='config-item'>
                    <Input
                        label='API Key'
                        labelPlacement='outside-left'
                        type='password'
                        value={config.apiKey ?? ''}
                        variant='bordered'
                        placeholder='Optional for local llama.cpp'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => update('apiKey', value)}
                    />
                </div>
                <h3 className='my-auto'>Prompt List</h3>
                <p className='text-[10px] text-default-700'>
                    $text, $from, $to and $detect are replaced at request time.
                </p>
                <div className='bg-content2 rounded-[10px] p-3'>
                    {(config.promptList ?? defaultPromptList).map((prompt, index) => (
                        <div
                            className='config-item'
                            key={`${prompt.role}-${index}`}
                        >
                            <Textarea
                                label={prompt.role}
                                labelPlacement='outside'
                                variant='faded'
                                value={prompt.content}
                                onValueChange={(value) =>
                                    update(
                                        'promptList',
                                        (config.promptList ?? defaultPromptList).map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, content: value } : item
                                        )
                                    )
                                }
                            />
                        </div>
                    ))}
                    <Button
                        fullWidth
                        onPress={() => {
                            const prompts = config.promptList ?? defaultPromptList;
                            update('promptList', [
                                ...prompts,
                                {
                                    role: prompts.length === 0 ? 'system' : prompts.length % 2 === 0 ? 'assistant' : 'user',
                                    content: '',
                                },
                            ]);
                        }}
                    >
                        {t('services.translate.openai.add')}
                    </Button>
                </div>
                <br />
                <Textarea
                    label='Request Arguments'
                    labelPlacement='outside'
                    variant='faded'
                    value={config.requestArguments ?? defaultRequestArguments}
                    description='JSON merged into the OpenAI-compatible request body.'
                    onValueChange={(value) => update('requestArguments', value)}
                />
                <br />
                <Button
                    type='submit'
                    isLoading={isLoading}
                    fullWidth
                    color='primary'
                >
                    {t('common.save')}
                </Button>
            </form>
        )
    );
}
