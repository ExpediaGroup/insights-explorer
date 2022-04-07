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
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  List,
  ListItem,
  useColorModeValue,
  useDisclosure,
  VStack
} from '@chakra-ui/react';

import { SidebarHeading } from '../../../../components/sidebar-heading/sidebar-heading';
import { SidebarStack } from '../../../../components/sidebar-stack/sidebar-stack';
import { iconFactoryAs } from '../../../../shared/icon-factory';

type HelpSidebarLink = { name: string; hash: string; children?: HelpSidebarLink[]; iex?: boolean };

interface Props {
  links: HelpSidebarLink[];
  headerTitle?: string;
}

const IexBadge = () => <Badge variant="frost">IEX</Badge>;

const SidebarContent = ({ links }) => {
  return (
    <Box
      position="sticky"
      top="1rem"
      flexBasis={{ base: '16rem', md: '20rem', xl: '22rem' }}
      maxWidth={{ base: '16rem', md: '20rem', xl: '26rem' }}
    >
      {links.map((link) => (
        <SidebarStack key={link.hash} mb="0.5rem">
          <SidebarHeading>
            <a href={`#${link.hash}`}>
              {link.name} {link.iex && <IexBadge />}
            </a>
          </SidebarHeading>
          {link.children && (
            <List>
              {link.children.map((child) => (
                <Box key={`${child.hash}-container`}>
                  <ListItem key={child.hash}>
                    <a href={`#${child.hash}`}>
                      {child.name} {child.iex && <IexBadge />}
                    </a>
                  </ListItem>
                  {child.children &&
                    child.children.map((secondChild) => (
                      <ListItem
                        key={secondChild.hash}
                        ml="0.5rem"
                        pl="0.5rem"
                        borderLeftWidth="3px"
                        borderColor="snowstorm.200"
                      >
                        <a href={`#${secondChild.hash}`}>
                          {secondChild.name} {secondChild.iex && <IexBadge />}
                        </a>
                      </ListItem>
                    ))}
                </Box>
              ))}
            </List>
          )}
        </SidebarStack>
      ))}
    </Box>
  );
};

export const HelpSidebar = ({ links, headerTitle, ...props }: Props & BoxProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const backgroundColor = useColorModeValue('nord.100', 'polar.100');

  return (
    <>
      <VStack
        display={{ base: 'none', sm: 'flex' }}
        spacing="1rem"
        align="stretch"
        flexBasis={{ base: '14rem', md: '16rem', xl: '22rem' }}
        flexShrink={0}
        maxWidth={{ base: '14rem', md: '16rem', xl: '26rem' }}
        ml="1rem"
        mt="1rem"
        pt="1rem"
        {...props}
      >
        <SidebarContent links={links} />
      </VStack>

      <IconButton
        display={{ base: 'flex', sm: 'none' }}
        aria-label={'Syntax Menu'}
        isRound={true}
        position="fixed"
        width="3rem"
        height="3rem"
        bottom="1.5rem"
        right="1.5rem"
        variant="frost"
        boxShadow="2px 2px 3px #555"
        icon={iconFactoryAs('listTree')}
        onClick={onOpen}
      />

      <Drawer placement="right" size="xs" isOpen={isOpen} onClose={onClose}>
        <DrawerOverlay>
          <DrawerContent>
            <DrawerHeader bg={backgroundColor}>{headerTitle}</DrawerHeader>
            <DrawerCloseButton />
            <DrawerBody bg={backgroundColor}>
              <SidebarContent links={links} />
            </DrawerBody>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    </>
  );
};
