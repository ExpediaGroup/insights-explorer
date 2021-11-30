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

import { Flex, Heading, Icon, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { useState } from 'react';
import { Helmet } from 'react-helmet';
import { IconType } from 'react-icons';
import { useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';

import { Card } from '../../components/card/card';
import { ExternalLink } from '../../components/external-link/external-link';
import { Link } from '../../components/link/link';
import { chatIcon } from '../../shared/chat-icon';
import { iconFactory } from '../../shared/icon-factory';
import { RootState } from '../../store/store';

import { GettingStartedPage } from './components/getting-started-page/getting-started-page';
import { IntegrationsPage } from './components/integrations-page/integrations-page';
import { MarkdownPage } from './components/markdown-page/markdown-page';

interface SubPage {
  name: string;
  path?: string;
  href?: string;
  icon: IconType;
}

const getSubPages = (appSettings) => {
  const subPages: SubPage[] = [
    {
      name: 'Getting Started',
      path: 'getting-started',
      icon: iconFactory('rocket')
    },
    {
      name: 'Markdown',
      path: 'markdown',
      icon: iconFactory('markdown')
    },
    {
      name: 'Integrations',
      path: 'integrations',
      icon: iconFactory('integration')
    }
  ];

  if (appSettings?.externalVideosUrl) {
    subPages.push({
      name: 'Videos',
      href: appSettings.externalVideosUrl,
      icon: iconFactory('video')
    });
  }

  if (appSettings?.externalDocUrl) {
    subPages.push({
      name: 'External Docs',
      href: appSettings.externalDocUrl,
      icon: iconFactory('linkExternal')
    });
  }

  if (appSettings?.chatSettings) {
    subPages.push({
      name: 'Chat Support',
      href: appSettings.chatSettings.url,
      icon: chatIcon(appSettings.chatSettings.provider)
    });
  }

  return subPages;
};

export const HelpPage = () => {
  const { appSettings } = useSelector((state: RootState) => state.app);
  const [subPages] = useState(getSubPages(appSettings));

  return (
    <Routes>
      <Route
        path="/*"
        element={
          <>
            <Helmet>
              <title>Help</title>
            </Helmet>

            <VStack spacing="2rem" align="center" p="2rem">
              <Heading as="h1" my="2rem">
                How can we help?
              </Heading>
              <Wrap spacing="2rem" justify="center">
                {subPages.map((page) => {
                  const innerCard = (
                    <Flex as={Card} flexDirection="column" align="center" justify="center" w="10rem" h="8rem">
                      <Icon as={page.icon} mb="0.5rem" fontSize="4rem" />
                      <Text>{page.name}</Text>
                    </Flex>
                  );

                  return (
                    <WrapItem key={page.name}>
                      {page.path && <Link to={`/help/${page.path}`}>{innerCard}</Link>}
                      {page.href && <ExternalLink href={page.href}>{innerCard}</ExternalLink>}
                    </WrapItem>
                  );
                })}
              </Wrap>
            </VStack>
          </>
        }
      />

      <Route path="/getting-started" element={<GettingStartedPage />} />
      <Route path="/markdown" element={<MarkdownPage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
    </Routes>
  );
};
