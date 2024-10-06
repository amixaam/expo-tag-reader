import * as React from 'react';

import { ExpoTagReaderViewProps } from './ExpoTagReader.types';

export default function ExpoTagReaderView(props: ExpoTagReaderViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
