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

import { Button, Collapse, Flex, HStack, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';

import { Alert } from '../../../../components/alert/alert';
import { Card } from '../../../../components/card/card';
import { Crumbs } from '../../../../components/crumbs/crumbs';
import { ExternalLink } from '../../../../components/external-link/external-link';
import { IexHeading } from '../../../../components/iex-heading/iex-heading';
import { Link } from '../../../../components/link/link';
import { CodeRendererAsync } from '../../../../components/renderers/code-renderer/code-renderer-async';
import { iconFactoryAs } from '../../../../shared/icon-factory';
import { HelpSidebar } from '../help-sidebar/help-sidebar';

import { importBookmarklet, importBookmarkletNewWindow } from './bookmarklets';

const links = [
  { name: 'Importing Insights', hash: 'importing-insights', children: [{ name: 'Bookmarklets', hash: 'bookmarklets' }] }
];

const Bookmarklet = ({ name, contents }) => {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <>
      <HStack spacing="1rem">
        <Button as={ExternalLink} href={contents} variant="solid" size="sm">
          {name}
        </Button>
        <Button
          rightIcon={isOpen ? iconFactoryAs('chevronUp') : iconFactoryAs('chevronDown')}
          size="xs"
          variant="ghost"
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          onClick={() => onToggle()}
        >
          {isOpen ? 'Hide Code' : 'Show Code'}
        </Button>
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <CodeRendererAsync contents={contents} copyButton={true} />
      </Collapse>
    </>
  );
};

export const IntegrationsPage = () => {
  return (
    <>
      <Helmet>
        <title>Integrations | Help</title>
      </Helmet>

      <Flex direction="row" mt="2rem" maxWidth={{ base: '100%', sm: 'none' }} flexBasis={{ base: 'auto', sm: 'none' }}>
        <VStack align="stretch" maxWidth={{ base: '100%', sm: 'none' }} flexBasis={{ base: 'auto', sm: 'none' }}>
          <Crumbs
            crumbs={[
              { text: 'Help', link: `/help` },
              { text: 'Integrations', link: '#' }
            ]}
          />

          <VStack as={Card} flexDirection="column" spacing="1rem" p="1rem" align="flex-start">
            <IexHeading level={1} id="integrations">
              Integrations
            </IexHeading>
            <Text>Insights Explorer integrates with various other tools to make your job easier!</Text>
            <IexHeading level={2} id="importing-insights">
              Importing Insights
            </IexHeading>
            <IexHeading level={3} id="bookmarklets">
              Bookmarklets
            </IexHeading>
            <Text>
              Insights Explorer offers several{' '}
              <ExternalLink href="https://support.mozilla.org/en-US/kb/bookmarklets-perform-common-web-page-tasks">
                bookmarklets
              </ExternalLink>{' '}
              for your convenience. Bookmarklets are little JavaScript links that live in the bookmarks toolbar of your
              browser and provide new functionality.
            </Text>
            <Text>Drag any of the following buttons into your browser's toolbar:</Text>
            <VStack spacing="1rem" align="flex-start" pl={{ base: 'none', sm: '2rem' }} w="full" overflow="scroll">
              <Bookmarklet name="IEX Import" contents={importBookmarklet()} />
              <Bookmarklet name="IEX Import (New Window)" contents={importBookmarkletNewWindow()} />
            </VStack>
            <Text>
              When clicked from your browser's bookmarks toolbar, it will scrape the contents of the current web page
              and immediately launch IEX with a new draft containing the contents of the web page. It is also possible
              to limit the scope of the import by selecting a sub-section of the page before activating the bookmarklet.
              Be advised that the accuracy of selection-based import may vary depending across different web pages.
            </Text>
            <Text>
              The HTML content is automatically converted to{' '}
              <Link to="/help/markdown" title="Markdown">
                Markdown
              </Link>
              ; please review the contents of the Insight to correct any errors before publishing.
            </Text>
            <Alert
              warning="If you are using Vivaldi you cannot drag and drop bookmarklets, and must instead create them manually using
            the JavaScript code."
            />
          </VStack>
        </VStack>

        <HelpSidebar links={links} headerTitle="Integrations" />
      </Flex>
    </>
  );
};
