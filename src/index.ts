import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to ExpoTagReader.web.ts
// and on native platforms to ExpoTagReader.ts
import ExpoTagReaderModule from './ExpoTagReaderModule';
import ExpoTagReaderView from './ExpoTagReaderView';
import { ChangeEventPayload, ExpoTagReaderViewProps } from './ExpoTagReader.types';

// Get the native constant value.
export const PI = ExpoTagReaderModule.PI;

export function hello(): string {
  return ExpoTagReaderModule.hello();
}

export async function setValueAsync(value: string) {
  return await ExpoTagReaderModule.setValueAsync(value);
}

const emitter = new EventEmitter(ExpoTagReaderModule ?? NativeModulesProxy.ExpoTagReader);

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { ExpoTagReaderView, ExpoTagReaderViewProps, ChangeEventPayload };
