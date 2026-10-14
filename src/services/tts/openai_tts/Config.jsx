import { Button, Input, Textarea } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';

import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { Language, info } from './info';
import { tts } from './index';

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const toastStyle = useToastStyle();
    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: info.displayName,
            requestPath: 'http://127.0.0.1:8081/v1/audio/speech',
            model: 'tts-1',
            apiKey: '',
            voice: 'alloy',
            responseFormat: 'wav',
            speed: 1,
            requestArguments: '{}',
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
                    tts('Hello', Language.en, { config }).then(
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
                        label='Model'
                        labelPlacement='outside-left'
                        value={config.model}
                        variant='bordered'
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
                        label='Voice'
                        labelPlacement='outside-left'
                        value={config.voice}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => update('voice', value)}
                    />
                </div>
                <div className='config-item'>
                    <Input
                        label='Audio format'
                        labelPlacement='outside-left'
                        value={config.responseFormat}
                        variant='bordered'
                        placeholder='wav / mp3 / opus'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => update('responseFormat', value)}
                    />
                </div>
                <div className='config-item'>
                    <Input
                        label='Speed'
                        labelPlacement='outside-left'
                        type='number'
                        step='0.1'
                        value={String(config.speed)}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => update('speed', Number(value))}
                    />
                </div>
                <div className='config-item'>
                    <Input
                        label='API Key'
                        labelPlacement='outside-left'
                        type='password'
                        value={config.apiKey}
                        variant='bordered'
                        placeholder='Optional for local servers'
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
