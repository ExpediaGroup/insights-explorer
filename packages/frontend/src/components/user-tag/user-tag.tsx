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
  Box,
  Divider,
  Heading,
  HStack,
  Icon,
  Placement,
  Popover,
  PopoverArrow,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Tag,
  TagLabel,
  TagProps,
  Text,
  Portal,
  Spinner,
  VStack,
  useColorModeValue
} from '@chakra-ui/react';

import { User } from '../../models/generated/graphql';
import { iconFactory } from '../../shared/icon-factory';
import { useUser } from '../../shared/useUser';
import { Link } from '../link/link';

const TextWithIcon = ({ children, icon }) => (
  <HStack>
    <Icon as={icon} color="frost.100" />
    <Text fontSize="sm">{children}</Text>
  </HStack>
);

const UserPopover = ({ userName }: { userName: string }) => {
  const [{ fetching, user }] = useUser({
    userName
  });

  if (fetching) {
    return <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="md" />;
  }

  if (!fetching && user) {
    return (
      <>
        <HStack align="top">
          <Avatar name={user.displayName} src={user?.avatarUrl} size="md" mr="0.5rem" />

          <VStack align="left" spacing="0.25rem">
            <HStack>
              <Heading as="h2" size="md">
                {user.displayName}
              </Heading>
              <Text fontSize="md" color="frost.100">
                @{user.userName}
              </Text>
            </HStack>

            {user.currentStatus && (
              <Text fontSize="sm" mb="2rem">
                <b>Current Status:</b> {user.currentStatus}
              </Text>
            )}

            <Divider borderColor="snowstorm.100" my="2rem" />

            {user.bio && <TextWithIcon icon={iconFactory('biography')}>{user.bio}</TextWithIcon>}

            {user.team && <TextWithIcon icon={iconFactory('team')}>{user.team}</TextWithIcon>}
            {user.location && <TextWithIcon icon={iconFactory('location')}>{user.location}</TextWithIcon>}
          </VStack>
        </HStack>
      </>
    );
  }

  return <Text>Unknown user</Text>;
};

export interface UserTagProps {
  user?: User;
  isLoading?: boolean;
  permission?: string;
  placement?: Placement;
}

export const UserTag = ({ user, isLoading, permission, placement = 'right', ...tagProps }: UserTagProps & TagProps) => {
  const popoverColor = useColorModeValue('whiteAlpha.900', 'gray.900');

  const avatarProps = {
    size: '2xs',
    ml: -1,
    mr: 2
  };

  if (tagProps.size === 'lg') {
    avatarProps.size = 'xs';
    avatarProps.ml = -2;
  }

  if (isLoading || user === undefined) {
    return (
      <Tag
        bg="nord13.200"
        rounded="full"
        size="md"
        _hover={{
          boxShadow: '0 0 0 3px rgba(136, 192, 208, 0.6)'
        }}
        {...tagProps}
      >
        <Box>
          <Avatar name="A" {...avatarProps} />
          <TagLabel>
            <Spinner thickness="2px" speed="0.65s" emptyColor="gray.200" color="frost.200" size="xs" />
          </TagLabel>
        </Box>
      </Tag>
    );
  }

  return (
    <Link to={`/profile/${user.userName}`}>
      <Popover isLazy placement={placement} trigger="hover">
        <PopoverTrigger>
          <Tag
            bg="nord13.200"
            rounded="full"
            size="md"
            _hover={{
              boxShadow: '0 0 0 3px rgba(136, 192, 208, 0.6)'
            }}
            {...tagProps}
          >
            <HStack justifyContent="space-between" w="full">
              <Box>
                <Avatar name={user.displayName} src={user?.avatarUrl} {...avatarProps} />
                <TagLabel>{user.displayName}</TagLabel>
              </Box>
              {permission && (
                <Box>
                  <Icon as={iconFactory('crown')} />
                </Box>
              )}
            </HStack>
          </Tag>
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            bg="polar.300"
            color={popoverColor}
            boxShadow="lg"
            borderRadius={0}
            width="auto"
            maxWidth="lg"
          >
            <PopoverArrow bg="polar.300" />
            <PopoverBody>
              <UserPopover userName={user.userName} />
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    </Link>
  );
};
