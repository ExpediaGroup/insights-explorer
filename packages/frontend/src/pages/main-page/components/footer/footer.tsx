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

import { HStack, Icon, Link, Text, useColorModeValue } from '@chakra-ui/react';
import { useSelector } from 'react-redux';

import { iconFactory } from '../../../../shared/icon-factory';
import { RootState } from '../../../../store/store';

const FooterItem = ({ children }) => (
  <HStack spacing="0.25rem" fontSize="xs" align="center">
    {children}
  </HStack>
);

export const Footer = (props) => {
  const { appSettings } = useSelector((state: RootState) => state.app);

  const bgColor = useColorModeValue('unset', 'gray.700');
  const color = useColorModeValue('gray.700', 'gray.200');

  let apolloSandboxLink;
  if (window.location.origin === 'http://localhost:3000') {
    apolloSandboxLink = 'http://localhost:3001/api/v1/graphql';
  } else {
    apolloSandboxLink = '/api/v1/graphql';
  }

  return (
    <HStack
      as="footer"
      spacing="1rem"
      align="center"
      justify="center"
      wrap="wrap"
      bg={bgColor}
      color={color}
      p="0.5rem"
      {...props}
    >
      {appSettings?.version && (
        <FooterItem>
          <Text>IEX v{appSettings.version}</Text>
        </FooterItem>
      )}
      {appSettings?.iexScmUrl && (
        <Link href={appSettings.iexScmUrl} isExternal={true}>
          <FooterItem>
            <Icon as={iconFactory('github')} />
            <Text>Source</Text>
          </FooterItem>
        </Link>
      )}
      <Link href={apolloSandboxLink} isExternal={true}>
        <FooterItem>
          <Icon as={iconFactory('graphql')} />
          <Text>Apollo Sandbox</Text>
        </FooterItem>
      </Link>
    </HStack>
  );
};
