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
  Box,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Text,
  Tooltip,
  useColorMode,
  useDisclosure
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

import { iconFactory, iconFactoryAs } from '../../../../shared/icon-factory';

import { CreateMenu } from './components/create-menu/create-menu';
import { HelpMenu } from './components/help-menu/help-menu';
import { UserMenu } from './components/user-menu/user-menu';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MenuItems = ({ children }) => (
  <Text mt={{ base: 4, md: 0 }} mr={6} display="block">
    {children}
  </Text>
);

export const Header = (props) => {
  const { isOpen, onToggle } = useDisclosure();

  const { colorMode, toggleColorMode } = useColorMode();

  const month = new Date().getMonth();
  const headerImage = month === 5 ? 'iex-logo-pride.png' : 'iex-logo.svg';

  return (
    <Flex as="header" align="center" justify="space-between" wrap="wrap" padding="1rem" {...props}>
      <Flex align="center" mr={5}>
        <RouterLink to="/">
          <Heading as="h1">
            <Image src={`/assets/${headerImage}`} height="2rem" display="inline-block" mr="0.5rem" alt="IEX Logo" />
            <Image src="/assets/iex-name.svg" height="1.33rem" display="inline-block" alt="Insights Explorer" />
          </Heading>
        </RouterLink>
      </Flex>

      <Icon
        as={iconFactory(isOpen ? 'close' : 'menu')}
        display={{ base: 'flex', md: 'none' }}
        onClick={onToggle}
        focusable={true}
      />

      <Box
        display={{
          base: isOpen ? 'flex' : 'none',
          md: 'flex'
        }}
        width={{ base: 'full', md: 'auto' }}
        justifyContent="end"
        mt={{ base: 4, md: 0 }}
      >
        <HStack spacing="0.5rem">
          <CreateMenu />

          {/* Disable dark mode for now.. */}
          <IconButton
            display="none"
            onClick={toggleColorMode}
            variant="ghost"
            aria-label="Toggle dark mode"
            icon={colorMode === 'light' ? iconFactoryAs('moon') : iconFactoryAs('sun')}
          />

          <Tooltip label="Activity Feed">
            <RouterLink to="/activities">
              <IconButton variant="ghost" aria-label="Activity Feed" icon={iconFactoryAs('activities')} />
            </RouterLink>
          </Tooltip>

          <HelpMenu />

          <Divider borderLeftColor="snowstorm.100" orientation="vertical" alignSelf="stretch" />

          <UserMenu />
        </HStack>
      </Box>
    </Flex>
  );
};
