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

import {
  Avatar,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  Tag,
  TagLabel,
  Text,
  VStack,
  Wrap
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';

import { ExternalLink } from '../../../../../../components/external-link/external-link';
import { Link } from '../../../../../../components/link/link';
import { TextWithIcon } from '../../../../../../components/text-with-icon/text-with-icon';
import { User } from '../../../../../../models/generated/graphql';
import { chatIcon } from '../../../../../../shared/chat-icon';
import { formatDateIntl } from '../../../../../../shared/date-utils';
import { iconFactory } from '../../../../../../shared/icon-factory';
import { RootState } from '../../../../../../store/store';

interface Props {
  user: User;
}

export const UserSidebar = ({ user }: Props) => {
  const { appSettings } = useSelector((state: RootState) => state.app);

  return (
    <Flex
      flexDirection="column"
      align="stretch"
      flexBasis={{ base: '16rem', xl: '20rem' }}
      flexShrink={0}
      maxWidth={{ base: 'unset', md: '16rem', xl: '20rem' }}
      mr="1rem"
      p="1rem"
    >
      <Flex flexDirection="column" align="center">
        <Avatar size="2xl" name={user.displayName} src={user.avatarUrl} mr="0.25rem" my="1rem" />

        <Heading as="h2" size="lg" alignSelf="center">
          {user.displayName}
        </Heading>
        <Text fontSize="lg" color="frost.100">
          @{user.userName}
        </Text>

        <Text color="frost.300" mt="1rem">
          Member since {formatDateIntl(user.createdAt, 'MMMM yyyy')}
        </Text>

        <Divider borderColor="snowstorm.100" my="2rem" />
      </Flex>

      <Text fontSize="md" mb="2rem">
        <b>Current Status:</b> {user.currentStatus}
      </Text>

      <VStack align="stretch" spacing=".75rem">
        {user.bio && <TextWithIcon iconName="biography">{user.bio}</TextWithIcon>}
        <ExternalLink href={`mailto:${user.email}`}>
          <TextWithIcon iconName="email">{user.email}</TextWithIcon>
        </ExternalLink>
        {user.title && <TextWithIcon iconName="briefcase">{user.title}</TextWithIcon>}
        {user.team && <TextWithIcon iconName="team">{user.team}</TextWithIcon>}
        {user.location && <TextWithIcon iconName="location">{user.location}</TextWithIcon>}
        {user.chatHandle && appSettings?.chatSettings && (
          <TextWithIcon icon={chatIcon(appSettings.chatSettings.provider)}>{user.chatHandle}</TextWithIcon>
        )}

        <HStack>
          <Icon as={iconFactory('tags')} color="frost.400" />
          <Wrap spacing="0.25rem" shouldWrapChildren={true}>
            {user.skills.map((skill) => (
              <Tag key={skill} bg="nord7.200" rounded="full" size="md">
                <TagLabel>{skill}</TagLabel>
              </Tag>
            ))}
          </Wrap>
        </HStack>
      </VStack>

      {user.isSelf && (
        <Button as={Link} to="/settings/profile" mt="3rem" variant="frost">
          Edit Profile
        </Button>
      )}
    </Flex>
  );
};
