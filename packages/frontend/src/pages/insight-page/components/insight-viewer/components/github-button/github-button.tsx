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

import type { BoxProps } from '@chakra-ui/react';
import { IconButton, Tooltip } from '@chakra-ui/react';
import titleize from 'titleize';

import { ExternalLink } from '../../../../../../components/external-link/external-link';
import type { Insight } from '../../../../../../models/generated/graphql';
import { iconFactoryAs } from '../../../../../../shared/icon-factory';

interface Props {
  insight: Insight;
  fontSize?: string;
  size?: string;
}

export const GitHubButton = ({ insight, fontSize = '1.5rem', size = 'lg', ...props }: Props & BoxProps) => {
  return (
    <ExternalLink href={insight.repository.url} isExternal={true} display="inline-block">
      <Tooltip
        placement="bottom"
        label={`Open the repository for this ${titleize(insight.itemType)}`}
        aria-label={`Open the repository for this ${titleize(insight.itemType)}`}
      >
        <IconButton
          variant="solid"
          fontSize={fontSize}
          size={size}
          aria-label="Open GitHub repository"
          icon={iconFactoryAs('github')}
        />
      </Tooltip>
    </ExternalLink>
  );
};
