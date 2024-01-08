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

import type { BoxProps } from '@chakra-ui/layout';
import { Badge, Box, Flex, HStack, Icon, Text, Tooltip, VStack } from '@chakra-ui/react';
import { useState } from 'react';

import type {
  Activity,
  ActivityEdge,
  CommentActivityDetails,
  InsightActivityDetails,
  InsightCollaboratorActivityDetails,
  NewsActivityDetails,
  User
} from '../../models/generated/graphql';
import { ActivityType } from '../../models/generated/graphql';
import { formatDateIntl, formatRelativeIntl } from '../../shared/date-utils';
import { iconFactory } from '../../shared/icon-factory';
import { BlockQuote } from '../blockquote/blockquote';
import { InsightConnectionCard } from '../insight-connection-card/insight-connection-card';
import { LikeButton } from '../like-button/like-button';
import { LikedByTooltip } from '../liked-by-tooltip/liked-by-tooltip';
import { Link } from '../link/link';
import { UserTag } from '../user-tag/user-tag';

const DeletedBadge = () => <Badge colorScheme="red">deleted</Badge>;

const getActivityParts = (activity: Activity) => {
  switch (activity.activityType) {
    case ActivityType.Login: {
      return {
        icon: 'login',
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            <Text as="span">logged in</Text>
          </Box>
        ),
        details: null
      };
    }

    case ActivityType.CreateInsight: {
      const details = activity.details as InsightActivityDetails;
      return {
        icon: 'newInsight',
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            {details.insight == null ? (
              <Text as="span">
                created a new <DeletedBadge />
              </Text>
            ) : (
              <Text as="span">
                created a new {details.insight.itemType}{' '}
                <Link to={`/${details.insight.itemType}/${details.insight.fullName}`} display="inline-block">
                  <Text as="span" fontWeight="bold">
                    {details.insight.name}
                  </Text>
                </Link>
                {details.commitMessage && `: "${details.commitMessage}"`}
              </Text>
            )}
          </Box>
        ),
        details: details.insight && (
          <InsightConnectionCard insightEdge={{ node: details.insight }} options={{ layout: 'compact' }} />
        )
      };
    }

    case ActivityType.EditInsight: {
      const details = activity.details as InsightActivityDetails;
      return {
        icon: 'edit',
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            {details.insight == null ? (
              <Text as="span">
                edited <DeletedBadge />
              </Text>
            ) : (
              <Text as="span">
                edited{' '}
                <Link to={`/${details.insight.itemType}/${details.insight.fullName}`} display="inline-block">
                  <Text as="span" fontWeight="bold">
                    {details.insight.name}
                  </Text>
                </Link>
                {details.commitMessage && `: "${details.commitMessage}"`}
              </Text>
            )}
          </Box>
        ),
        details: details.insight && (
          <InsightConnectionCard insightEdge={{ node: details.insight }} options={{ layout: 'compact' }} />
        )
      };
    }

    case ActivityType.DeleteInsight: {
      const details = activity.details as InsightActivityDetails;
      return {
        icon: 'trash',
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            {details.insight == null ? (
              <Text as="span">
                deleted <DeletedBadge />
              </Text>
            ) : (
              <Text as="span">
                deleted{' '}
                <Link to={`/${details.insight.itemType}/${details.insight.fullName}`} display="inline-block">
                  <Text as="span" fontWeight="bold">
                    {details.insight.name}
                  </Text>
                </Link>
              </Text>
            )}
          </Box>
        ),
        details: details.insight && (
          <InsightConnectionCard insightEdge={{ node: details.insight }} options={{ layout: 'compact' }} />
        )
      };
    }

    case ActivityType.LikeInsight:
    case ActivityType.UnlikeInsight: {
      const details = activity.details as InsightActivityDetails;

      let icon = 'heartFilled';
      let verb = 'liked';

      if (activity.activityType === ActivityType.UnlikeInsight) {
        icon = 'unlike';
        verb = 'unliked';
      }

      return {
        icon,
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            <Text as="span">
              {verb}{' '}
              {details.insight == null ? (
                <DeletedBadge />
              ) : (
                <Link to={`/${details.insight.itemType}/${details.insight.fullName}`} display="inline-block">
                  <Text as="span" fontWeight="bold">
                    {details.insight.name}
                  </Text>
                </Link>
              )}
            </Text>
          </Box>
        ),
        details: details.insight && (
          <InsightConnectionCard insightEdge={{ node: details.insight }} options={{ layout: 'compact' }} />
        )
      };
    }

    case ActivityType.ViewInsight: {
      const icon = 'views';
      const verb = 'viewed';

      const details = activity.details as InsightActivityDetails;
      return {
        icon,
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            <Text as="span">
              {verb}{' '}
              {details.insight == null ? (
                <DeletedBadge />
              ) : (
                <Link to={`/${details.insight.itemType}/${details.insight.fullName}`} display="inline-block">
                  <Text as="span" fontWeight="bold">
                    {details.insight.name}
                  </Text>
                </Link>
              )}
            </Text>
          </Box>
        )
      };
    }

    case ActivityType.CreateComment:
    case ActivityType.EditComment:
    case ActivityType.LikeComment:
    case ActivityType.UnlikeComment:
    case ActivityType.DeleteComment: {
      const details = activity.details as CommentActivityDetails;
      let icon = 'icon';
      let verb = 'verb';

      switch (activity.activityType) {
        case ActivityType.CreateComment: {
          icon = 'comments';
          verb = 'commented on';
          break;
        }
        case ActivityType.EditComment: {
          icon = 'comments';
          verb = 'edited a comment on';
          break;
        }
        case ActivityType.LikeComment: {
          icon = 'heartFilled';
          verb = 'liked a comment on';
          break;
        }
        case ActivityType.UnlikeComment: {
          icon = 'unlike';
          verb = 'unliked a comment on';
          break;
        }
        case ActivityType.DeleteComment: {
          icon = 'trash';
          verb = 'deleted a comment on';
          break;
        }
      }

      return {
        icon,
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            <Text as="span">
              {verb}{' '}
              {details?.comment == null ? (
                <DeletedBadge />
              ) : (
                <Link
                  to={`/${details.comment.insight.itemType}/${details.comment.insight.fullName}`}
                  display="inline-block"
                >
                  <Text as="span" fontWeight="bold">
                    {details.comment.insight.name}
                  </Text>
                </Link>
              )}
            </Text>
          </Box>
        ),
        details: details?.comment && <BlockQuote>{details.comment.commentText}</BlockQuote>
      };
    }

    case ActivityType.UpdateProfile: {
      return {
        icon: 'profile',
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            <Text as="span">
              updated their{' '}
              <Link to={`/profile/${activity.user.userName}`} display="inline-block">
                profile
              </Link>
            </Text>
          </Box>
        )
      };
    }

    case ActivityType.AddCollaborator:
    case ActivityType.RemoveCollaborator: {
      const details = activity.details as InsightCollaboratorActivityDetails;
      const added = activity.activityType === ActivityType.AddCollaborator;

      return {
        icon: 'permissions',
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            <Text as="span">
              {added ? <Text as="span">added </Text> : <Text as="span">removed </Text>}
              <UserTag user={details.user} mr="0.25rem" />
              {added ? ' to ' : ' from '}
              {details.insight == null ? (
                <DeletedBadge />
              ) : (
                <Link to={`/${details.insight.itemType}/${details.insight.fullName}`} display="inline-block">
                  <Text as="span" fontWeight="bold">
                    {details.insight.name}
                  </Text>
                </Link>
              )}
            </Text>
          </Box>
        ),
        details: details.insight && (
          <InsightConnectionCard insightEdge={{ node: details.insight }} options={{ layout: 'compact' }} />
        )
      };
    }

    case ActivityType.LikeNews:
    case ActivityType.UnlikeNews: {
      const details = activity.details as NewsActivityDetails;

      let icon = 'heartFilled';
      let verb = 'liked';

      if (activity.activityType === ActivityType.UnlikeNews) {
        icon = 'unlike';
        verb = 'unliked';
      }

      return {
        icon,
        lead: (
          <Box>
            <UserTag user={activity.user} mr="0.25rem" />
            <Text as="span">
              {verb} <Text as="span">a news item: </Text>
              {details.news === null ? (
                <DeletedBadge />
              ) : (
                <Text as="span" fontWeight="bold">
                  {details.news.summary}
                </Text>
              )}
            </Text>
          </Box>
        ),
        details: null
      };
    }

    default: {
      return null;
    }
  }
};

export interface ActivityProps {
  activityEdge: ActivityEdge;
  onFetchLikedBy: (activityId: string) => Promise<User[]>;
  onLike: (activityId: string, liked: boolean) => Promise<boolean>;
}

export const ActivityView = ({ activityEdge, onFetchLikedBy, onLike, ...props }: ActivityProps & BoxProps) => {
  const activity = activityEdge.node;
  const viewParts = getActivityParts(activity);

  // Persist this here so we can toggle it manually
  const [liked, setLiked] = useState(activity.viewerHasLiked);
  const [likeCount, setLikeCount] = useState(activity.likeCount);

  const likeLabel = `${liked ? 'Unlike' : 'Like'} this activity`;
  const { isOwnActivity } = activity;

  const toggleLike = async (liked: boolean) => {
    const success = await onLike(activity.id, liked);

    // Flip the liked indicator
    // TODO: Our pagination implementation doesn't push the update automatically
    if (success) {
      setLiked(liked);
      setLikeCount(liked ? likeCount + 1 : likeCount - 1);
    }

    return success;
  };

  return (
    <HStack key={activity.id} {...props} align="flex-start">
      <Icon as={iconFactory(viewParts?.icon ?? 'unknown')} boxSize="1.5rem" display="inline-block" />
      {viewParts !== null && (
        <VStack align="stretch" flexGrow={1}>
          <Flex
            flexDirection={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', sm: 'flex-end' }}
          >
            {viewParts.lead}

            <Tooltip
              label={formatDateIntl(activity.occurredAt)}
              aria-label={`Occurred at ${formatDateIntl(activity.occurredAt)}`}
            >
              <Text fontSize="xs" color="polar.600" flexShrink={0}>
                {formatRelativeIntl(activity.occurredAt)}
              </Text>
            </Tooltip>
          </Flex>
          {viewParts?.details}
          <Flex>
            <LikedByTooltip
              label={likeLabel}
              likeCount={likeCount}
              onFetchLikedBy={() => onFetchLikedBy(activity.id)}
              placement="bottom"
            >
              <LikeButton
                label={likeLabel}
                liked={liked}
                likeCount={likeCount}
                onLike={toggleLike}
                disabled={isOwnActivity}
                size="xs"
              />
            </LikedByTooltip>
          </Flex>
        </VStack>
      )}
      {viewParts === null && (
        <Text>
          {activity.activityType} by {activity.user.displayName}
        </Text>
      )}
    </HStack>
  );
};
