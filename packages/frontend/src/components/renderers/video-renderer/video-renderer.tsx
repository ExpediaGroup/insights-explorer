/**
 * Copyright 2021 Expedia, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DetailedHTMLProps, ReactNode, VideoHTMLAttributes } from 'react';

import { isRelativeUrl } from '../../../shared/url-utils';

interface Props {
  mimeType: string;
  transformAssetUri?: ((uri: string, children?: ReactNode, title?: string, alt?: string) => string) | null;
  url?: string;
}

type VideoProps = Partial<DetailedHTMLProps<VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>>;

export const VideoRenderer = ({ url, mimeType, transformAssetUri, ...videoProps }: Props & VideoProps) => {
  if (url && transformAssetUri && isRelativeUrl(url)) {
    url = transformAssetUri(url);
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video controls preload="auto" playsInline {...videoProps}>
      <source src={url} type={mimeType} />
    </video>
  );
};
