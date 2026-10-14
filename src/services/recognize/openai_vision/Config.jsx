import { Button, Input, Textarea } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';

import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { recognize } from './index';
import { Language, info } from './info';

const DEFAULT_REQUEST_ARGUMENTS = JSON.stringify(
    {
        temperature: 0,
        max_tokens: 4096,
    },
    null,
    2
);

const DEFAULT_PROMPT =
    'Perform OCR on this image. Return only the recognized text. Preserve paragraph and line breaks where meaningful. Do not translate, summarize, explain, or add markdown fences. Transcribe formulas, punctuation, and symbols faithfully. Preferred language: $lang.';

const TEST_IMAGE =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

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
            prompt: DEFAULT_PROMPT,
            requestArguments: DEFAULT_REQUEST_ARGUMENTS,
        },
        { sync: false }
    );

    const update = (key, value) => setConfig({ ...config, [key]: value });

    return (
        config !== null && (
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setIsLoading(true);
                    recognize(TEST_IMAGE, Language.en, { config }).then(
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
                        value={config[INSTANCE_NAME_CONFIG_KEY]}
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
                    <Input
                        label='Endpoint'
                        labelPlacement='outside-left'
                        value={config.requestPath}
                        variant='bordered'
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
                        value={config.model}
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
                        value={config.apiKey}
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
                <div className='config-item'>
                    <Textarea
                        label='OCR Prompt'
                        labelPlacement='outside'
                        value={config.prompt}
                        variant='faded'
                        description='$lang is replaced with the selected OCR language.'
                        onValueChange={(value) => update('prompt', value)}
                    />
                </div>
                <div className='config-item'>
                    <Textarea
                        label='Request Arguments'
                        labelPlacement='outside'
                        value={config.requestArguments}
                        variant='faded'
                        description='JSON merged into the OpenAI-compatible request body.'
                        onValueChange={(value) => update('requestArguments', value)}
                    />
                </div>
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
