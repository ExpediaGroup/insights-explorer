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
import {
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  StackDivider,
  Tag,
  TagLabel,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
  Heading
} from '@chakra-ui/react';
import { DateTime } from 'luxon';

import { ExternalLink } from '../../../../../../components/external-link/external-link';
import { InsightTag } from '../../../../../../components/insight-tag/insight-tag';
import { Link } from '../../../../../../components/link/link';
import { Linkify } from '../../../../../../components/linkify/linkify';
import { SidebarHeading } from '../../../../../../components/sidebar-heading/sidebar-heading';
import { SidebarStack } from '../../../../../../components/sidebar-stack/sidebar-stack';
import { TeamTag } from '../../../../../../components/team-tag/team-tag';
import { UserTag } from '../../../../../../components/user-tag/user-tag';
import type { Insight } from '../../../../../../models/generated/graphql';
import { formatDateIntl, formatRelativeIntl } from '../../../../../../shared/date-utils';
import { iconFactory } from '../../../../../../shared/icon-factory';
import { groupInsightLinks } from '../../../../../../shared/insight-utils';
import { GitHubButton } from '../github-button/github-button';
import { ShareMenu } from '../share-menu/share-menu';

export const InsightSidebar = ({ insight, ...props }: { insight: Insight } & BoxProps) => {
  const fileBgColor = useColorModeValue('white', 'gray.700');

  if (insight == null) {
    return <Box></Box>;
  }

  const authors = insight.authors.edges.reduce((acc, { node: author }) => {
    const collab = insight.collaborators?.edges.find(({ permission, node: collaborator }) => {
      return collaborator.id === author.id;
    });

    if (collab) {
      acc.push({ ...author, permission: collab.permission });
    } else {
      acc.push(author);
    }
    return acc;
  }, [] as any);

  // Group links into sections, with a default section of `Links`
  const links = groupInsightLinks(insight.links);

  return (
    <VStack spacing="1rem" align="stretch" {...props} pt="0.5rem">
      <SidebarStack heading="About">
        <Text>
          <Linkify>{insight.description}</Linkify>
        </Text>
        <HStack mb="0.25rem">
          {insight.metadata?.publishedDate != null && (
            <Tooltip
              placement="bottom"
              label={`Published on ${formatDateIntl(insight.metadata.publishedDate, DateTime.DATETIME_MED)}`}
              aria-label="Published"
            >
              <Badge colorScheme="green">Published</Badge>
            </Tooltip>
          )}
        </HStack>
        {insight.readme?.readingTime && (
          <Flex align="center">
            <Icon as={iconFactory('time')} mr="0.5rem" /> Est. time to read:{' '}
            {Math.round(insight.readme.readingTime.minutes)} min
          </Flex>
        )}
      </SidebarStack>

      {insight.metadata?.publishedDate != null && (
        <SidebarStack heading="Published Date" tooltip="Date Insight was published to customers.">
          <Text>{formatDateIntl(insight.metadata.publishedDate, DateTime.DATE_MED)}</Text>
        </SidebarStack>
      )}

      <SidebarStack heading="Last Updated" tooltip="Date Insight was most-recently updated.">
        <Text>
          {formatDateIntl(insight.updatedAt, DateTime.DATETIME_MED)} ({formatRelativeIntl(insight.updatedAt)})
        </Text>
      </SidebarStack>

      <SidebarStack heading="Created" tooltip="Date Insight was created.">
        <Text>
          {formatDateIntl(insight.createdAt, DateTime.DATETIME_MED)} ({formatRelativeIntl(insight.createdAt)})
        </Text>
      </SidebarStack>

      <HStack spacing="0.5rem">
        <GitHubButton insight={insight} />

        <ShareMenu insight={insight} />
      </HStack>

      <StackDivider borderColor="snowstorm.100" borderTopWidth="1px" />

      <SidebarStack heading="Team" tooltip="Team which owns this Insight">
        <TeamTag team={insight.metadata?.team ?? 'Unknown'} size="lg" />
      </SidebarStack>

      <StackDivider borderColor="snowstorm.100" borderTopWidth="1px" />

      <SidebarHeading>Authors</SidebarHeading>
      <Stack spacing="0.25rem">
        {authors.map((author) => (
          <UserTag key={author.userName} user={author} permission={author.permission} size="lg" width="100%" />
        ))}
      </Stack>
      {insight.tags?.length > 0 && (
        <>
          <StackDivider borderColor="snowstorm.100" borderTopWidth="1px" />
          <SidebarHeading>Tags</SidebarHeading>
          <Stack spacing="0.25rem">
            {insight.tags.map((tag) => (
              <InsightTag key={tag} tag={tag} size="lg" />
            ))}
          </Stack>
        </>
      )}

      {links.length > 0 && (
        <>
          <StackDivider borderColor="snowstorm.100" borderTopWidth="1px" />
          <SidebarHeading>Links</SidebarHeading>
          {links.map(({ group, links: subLinks }) => (
            <Stack spacing="0.25rem" key={group}>
              <Heading as="h3" size="xs" pb="0.5rem">
                {group}
              </Heading>
              {subLinks.map((link, index) => (
                <ExternalLink href={link.url} key={`${link.url}-${index}`}>
                  <Tag size="lg" rounded="full" bg="nord7.100">
                    <TagLabel>
                      {link.name && link.name.length > 0 ? link.name : link.url}
                      <Icon as={iconFactory('linkExternal')} ml="0.5rem" />
                    </TagLabel>
                  </Tag>
                </ExternalLink>
              ))}
            </Stack>
          ))}
        </>
      )}

      {insight.files && insight.files.length > 0 && (
        <>
          <StackDivider borderColor="snowstorm.100" borderTopWidth="1px" />
          <SidebarHeading>Files</SidebarHeading>
          <Stack spacing="0.25rem">
            {insight.files.map((file) => {
              return (
                <Link to={`/${insight.itemType}/${insight.fullName}/files/${file.path}`} key={file.id}>
                  <Tag bg={fileBgColor} rounded="full">
                    <TagLabel>{file.path}</TagLabel>
                  </Tag>
                </Link>
              );
            })}
          </Stack>
        </>
      )}
    </VStack>
  );
};
