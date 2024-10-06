import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { ExpoTagReaderViewProps } from './ExpoTagReader.types';

const NativeView: React.ComponentType<ExpoTagReaderViewProps> =
  requireNativeViewManager('ExpoTagReader');

export default function ExpoTagReaderView(props: ExpoTagReaderViewProps) {
  return <NativeView {...props} />;
}
