/**
 * Copyright 2022 Expedia, Inc.
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

import type { StackProps } from '@chakra-ui/react';
import {
  Badge,
  Box,
  Collapse,
  Flex,
  HStack,
  Icon,
  IconButton,
  Stack,
  Tag,
  TagLabel,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { DateTime } from 'luxon';

import { ExternalLink } from '../../../../../../components/external-link/external-link';
import { InsightTag } from '../../../../../../components/insight-tag/insight-tag';
import { Link } from '../../../../../../components/link/link';
import { Linkify } from '../../../../../../components/linkify/linkify';
import { SidebarHeading } from '../../../../../../components/sidebar-heading/sidebar-heading';
import { TeamTag } from '../../../../../../components/team-tag/team-tag';
import { UserTag } from '../../../../../../components/user-tag/user-tag';
import type { Insight } from '../../../../../../models/generated/graphql';
import { formatDateIntl, formatRelativeIntl } from '../../../../../../shared/date-utils';
import { iconFactory, iconFactoryAs } from '../../../../../../shared/icon-factory';
import { groupInsightLinks } from '../../../../../../shared/insight-utils';
import { GitHubButton } from '../github-button/github-button';
import { ShareMenu } from '../share-menu/share-menu';

export const InsightInfobar = ({ insight, ...props }: { insight: Insight } & StackProps) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });

  // Group links into sections, with a default section of `Links`
  const links = groupInsightLinks(insight.links);

  return (
    <VStack align="stretch" p="0.5rem" {...props}>
      <Flex flexDirection="row" align="flex-start" justify="space-between">
        <Stack spacing="0.25rem" direction={{ base: 'column', md: 'row' }} align="flex-start" justify="flex-start">
          <IconButton
            aria-label="Expand/collapse"
            icon={isOpen ? iconFactoryAs('chevronUp') : iconFactoryAs('chevronDown')}
            variant="ghost"
            size="sm"
            onClick={onToggle}
            title={isOpen ? 'Collapse this section' : 'Expand this section'}
          />
          <Wrap spacing="0.25rem" shouldWrapChildren={true} align="center" pt="0.25rem">
            {insight.metadata?.team && <TeamTag team={insight.metadata.team} size="md" />}

            {insight.authors.edges.map(({ node: author }) => (
              <UserTag key={author.userName} user={author} size="md" width="100%" />
            ))}

            {insight.tags?.length > 0 && insight.tags.map((tag) => <InsightTag key={tag} tag={tag} size="md" />)}
          </Wrap>
        </Stack>

        <HStack flexShrink={0}>
          <GitHubButton insight={insight} size="sm" fontSize="1rem" mr="0.5rem" />
          <ShareMenu insight={insight} size="sm" fontSize="1rem" />
        </HStack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <VStack spacing="1rem" align="stretch" mt="0.5rem" ml={{ base: 0, md: '2.5rem' }}>
          <Wrap align="flex-start" spacing="0.5rem">
            <WrapItem alignItems="baseline">
              <SidebarHeading mr="0.5rem">About</SidebarHeading>
              <Box>
                <Linkify>{insight.description}</Linkify>

                {insight.metadata?.publishedDate != null && (
                  <Tooltip
                    placement="bottom"
                    label={`Published on ${formatDateIntl(insight.metadata.publishedDate, DateTime.DATETIME_MED)}`}
                    aria-label="Published"
                  >
                    <Badge colorScheme="green" m="0.5rem">
                      Published
                    </Badge>
                  </Tooltip>
                )}

                {insight.readme?.readingTime && (
                  <Flex align="center">
                    <Icon as={iconFactory('time')} mr="0.5rem" /> Est. time to read:{' '}
                    {Math.round(insight.readme.readingTime.minutes)} min
                  </Flex>
                )}
              </Box>
            </WrapItem>

            {insight.metadata?.publishedDate != null && (
              <WrapItem alignItems="baseline">
                <SidebarHeading mr="0.5rem">Published Date</SidebarHeading>
                <Text fontSize="md">{formatDateIntl(insight.metadata.publishedDate, DateTime.DATE_MED)}</Text>
              </WrapItem>
            )}

            <WrapItem alignItems="baseline">
              <SidebarHeading mr="0.5rem">Last Updated</SidebarHeading>
              <Text fontSize="md">
                {formatDateIntl(insight.updatedAt, DateTime.DATETIME_MED)} ({formatRelativeIntl(insight.updatedAt)})
              </Text>
            </WrapItem>

            <WrapItem alignItems="baseline">
              <SidebarHeading mr="0.5rem">Created</SidebarHeading>
              <Text fontSize="md">
                {formatDateIntl(insight.createdAt, DateTime.DATETIME_MED)} ({formatRelativeIntl(insight.createdAt)})
              </Text>
            </WrapItem>
          </Wrap>

          {links.length > 0 && (
            <Wrap align="center" spacing="0.5rem" shouldWrapChildren={true}>
              <SidebarHeading mr="0.5rem">Links</SidebarHeading>
              {links.map(({ group, links: subLinks }) => {
                return subLinks.map((link, index) => (
                  <ExternalLink href={link.url} key={`${link.url}-${index}`}>
                    <Tag rounded="full">
                      <TagLabel>
                        {link.name && link.name.length > 0 ? link.name : link.url}
                        <Icon as={iconFactory('linkExternal')} ml="0.5rem" />
                      </TagLabel>
                    </Tag>
                  </ExternalLink>
                ));
              })}
            </Wrap>
          )}

          {insight.files && insight.files.length > 0 && (
            <Wrap align="center" spacing="0.5rem" shouldWrapChildren={true}>
              <SidebarHeading mr="0.5rem">Files</SidebarHeading>
              {insight.files.map((file) => {
                return (
                  <Link to={`/${insight.itemType}/${insight.fullName}/files/${file.path}`} key={file.id}>
                    <Tag rounded="full">
                      <TagLabel>{file.path}</TagLabel>
                    </Tag>
                  </Link>
                );
              })}
            </Wrap>
          )}
        </VStack>
      </Collapse>
    </VStack>
  );
};
