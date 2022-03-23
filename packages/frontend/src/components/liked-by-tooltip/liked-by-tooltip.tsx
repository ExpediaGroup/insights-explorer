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

import type { Placement } from '@chakra-ui/react';
import {
  Avatar,
  Box,
  Button,
  HStack,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack
} from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { User } from '../../models/generated/graphql';
import { Link as RouterLink } from '../link/link';
import { OxfordComma } from '../oxford-comma/oxford-comma';

const LikedByUser = ({ navigate, useLinks, user }) => {
  if (useLinks) {
    return (
      <RouterLink display="inline" to={`/profile/${user.email}`} key={user.email} fontSize="sm">
        {user.displayName}
      </RouterLink>
    );
  } else {
    return (
      <Link
        as="span"
        display="inline"
        onClick={(e) => {
          e.preventDefault();
          navigate(`/profile/${user.email}`);
        }}
        key={user.email}
        fontSize="sm"
      >
        {user.displayName}
      </Link>
    );
  }
};

interface LikedByMessageProps {
  label: string;
  likedBy: User[] | undefined;
  onFetchLikedBy: () => Promise<void>;
  onModalOpen: () => void;
  useLinks: boolean;
}

const LikedByMessage = ({ label, likedBy, onFetchLikedBy, onModalOpen, useLinks }: LikedByMessageProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      // This fetch is triggered here to delay until the tooltip is actually loaded.
      // This will prevent loading this data unless the user actually wants to see it
      if (likedBy === undefined) {
        await onFetchLikedBy();

        // Avoid changing state if already unmounted
        if (cancelled) return;
      }
    };

    fetch();

    return () => {
      cancelled = true;
      return;
    };
  }, [likedBy, onFetchLikedBy]);

  // If we haven't loaded any data, show a spinner
  if (likedBy === undefined) {
    return <Spinner thickness="4px" speed="0.65s" mt="6px" emptyColor="snowstorm.300" color="frost.200" size="sm" />;
  }

  if (likedBy.length > 0) {
    // Avoid "and 1 more user"
    const firstUsers = likedBy.slice(0, likedBy.length === 5 ? 3 : 4);
    const remainingCount = likedBy.length - firstUsers.length;

    const names = firstUsers.map<ReactNode>((user) => {
      return <LikedByUser navigate={navigate} useLinks={useLinks} user={user} />;
    });

    if (remainingCount > 0) {
      names.push(
        <Link
          as="span"
          onClick={(e) => {
            e.preventDefault();
            onModalOpen();
          }}
        >
          {remainingCount} other user{remainingCount > 1 && 's'}
        </Link>
      );
    }

    return (
      <>
        <OxfordComma items={names} /> like{likedBy.length === 1 && 's'} this
      </>
    );
  }

  // Otherwise just show the normal label
  return <Text>{label}</Text>;
};

interface Props {
  children: any;
  label: string;
  likeCount?: number;
  onFetchLikedBy?: () => Promise<User[]>;
  placement?: Placement;
  useLinks?: boolean;
}

export const LikedByTooltip = ({
  children,
  label,
  likeCount,
  onFetchLikedBy,
  placement = 'bottom',
  useLinks = true
}: Props) => {
  // LikedBy users (lazy loaded)
  const [likedBy, setLikedBy] = useState<User[]>();

  // Disclosure for showing the full list of liked by users
  const { isOpen, onOpen, onClose } = useDisclosure();

  const onFetchLikedByInternal = async () => {
    if (likeCount === 0 || onFetchLikedBy === undefined) {
      setLikedBy([]);
    } else if (likedBy === undefined) {
      const users = await onFetchLikedBy();
      setLikedBy(users);
    }
  };

  return (
    // This popover is styled to look like a tooltip
    <>
      <Popover
        isLazy
        placement={placement}
        trigger="hover"
        styleConfig={{
          width: 'unset'
        }}
      >
        <PopoverTrigger>
          <Box>{children}</Box>
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            fontSize="sm"
            bg="polar.300"
            color={useColorModeValue('whiteAlpha.900', 'gray.900')}
            borderRadius={0}
            boxShadow="md"
          >
            <PopoverBody px="8px" py="2px">
              <LikedByMessage
                label={label}
                likedBy={likedBy}
                onFetchLikedBy={onFetchLikedByInternal}
                onModalOpen={onOpen}
                useLinks={useLinks}
              />
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>

      <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Users who like this</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing="1rem" align="stretch">
              {likedBy?.map((user) => {
                return (
                  <HStack key={user.email} align="center">
                    <Avatar name={user.displayName} size="sm" />

                    <RouterLink to={`/profile/${user.email}`}>
                      <Text fontWeight="bold" fontSize="md">
                        {user.displayName}
                      </Text>
                    </RouterLink>
                  </HStack>
                );
              })}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="polar" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
