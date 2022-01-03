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

import { Badge, Box, BoxProps, List, ListItem, VStack } from '@chakra-ui/react';

import { SidebarHeading } from '../../../../components/sidebar-heading/sidebar-heading';
import { SidebarStack } from '../../../../components/sidebar-stack/sidebar-stack';

type HelpSidebarLink = { name: string; hash: string; children?: HelpSidebarLink[]; iex?: boolean };

interface Props {
  links: HelpSidebarLink[];
}

const IexBadge = () => <Badge variant="frost">IEX</Badge>;

export const HelpSidebar = ({ links, ...props }: Props & BoxProps) => {
  return (
    <VStack
      spacing="1rem"
      align="stretch"
      flexBasis={{ base: '16rem', md: '20rem', xl: '22rem' }}
      flexShrink={0}
      maxWidth={{ base: '16rem', md: '20rem', xl: '26rem' }}
      ml="1rem"
      mt="1rem"
      pt="1rem"
      {...props}
    >
      <Box position="sticky" top="1rem" overflowY="auto" maxHeight="100vh">
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
    </VStack>
  );
};
