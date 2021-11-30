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

import { Badge, Box, HStack, Icon, StackProps, Tooltip } from '@chakra-ui/react';

import { LikedByTooltip } from '../../../../components/liked-by-tooltip/liked-by-tooltip';
import { iconFactory } from '../../../../shared/icon-factory';
import { useLikedBy } from '../../../../shared/useLikedBy';

interface Props {
  commentCount?: number;
  insightId?: string;
  likeCount?: number;
  viewerHasLiked?: boolean;
}

export const InsightStats = ({
  commentCount,
  insightId,
  likeCount,
  viewerHasLiked,
  ...stackProps
}: Props & StackProps) => {
  const { onFetchLikedBy } = useLikedBy('insight');

  return (
    <HStack spacing="0.5rem" {...stackProps}>
      <HStack spacing={0} flexShrink={0}>
        <Tooltip label="Number of comments" aria-label="Number of comments">
          <Box>
            <Icon as={iconFactory('comments')} aria-label="Discussion" />

            <Badge bg="transparent">{commentCount}</Badge>
          </Box>
        </Tooltip>
      </HStack>

      <HStack spacing={0} flexShrink={0}>
        <LikedByTooltip
          label="Number of likes"
          likeCount={likeCount}
          onFetchLikedBy={() => onFetchLikedBy(insightId)}
          placement="left"
          useLinks={false}
        >
          <Box>
            <Icon
              color={viewerHasLiked ? 'aurora.100' : 'polar.600'}
              aria-label="Liked"
              as={viewerHasLiked ? iconFactory('heartFilled') : iconFactory('heart')}
            />
            <Badge bg="transparent">{likeCount}</Badge>
          </Box>
        </LikedByTooltip>
      </HStack>
    </HStack>
  );
};
