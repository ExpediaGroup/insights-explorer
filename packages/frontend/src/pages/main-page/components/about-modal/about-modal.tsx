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
  Button,
  HStack,
  Image,
  Link,
  List,
  ListItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  UnorderedList,
  useDisclosure,
  VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

import { ExternalLink } from '../../../../components/external-link/external-link';
import { IexMenuItem } from '../../../../components/iex-menu-item/iex-menu-item';
import { Link as RouterLink } from '../../../../components/link/link';
import { AppSettings } from '../../../../models/generated/graphql';

const icons = [
  {
    name: 'Ant Design Icons',
    url: 'https://github.com/ant-design/ant-design-icons',
    license: 'MIT',
    licenseUrl: 'https://github.com/ant-design/ant-design-icons/blob/master/LICENSE'
  },
  {
    name: 'Bootstrap Icons',
    url: 'https://github.com/twbs/icons',
    license: 'MIT',
    licenseUrl: 'https://github.com/twbs/icons/blob/main/LICENSE.md'
  },
  {
    name: 'Feather Icons',
    url: 'https://feathericons.com/',
    license: 'MIT',
    licenseUrl: 'https://github.com/feathericons/feather/blob/master/LICENSE'
  },
  {
    name: 'Font Awesome',
    url: 'https://github.com/FortAwesome/Font-Awesome',
    license: 'CC BY 4.0',
    licenseUrl: 'https://github.com/FortAwesome/Font-Awesome/blob/master/LICENSE.txt'
  },
  {
    name: 'GitHub Octicons',
    url: 'https://primer.style/octicons/',
    license: 'MIT',
    licenseUrl: 'https://github.com/primer/octicons/blob/master/LICENSE'
  },
  {
    name: 'Grommet Icons',
    url: 'https://github.com/grommet/grommet-icons',
    license: 'Apache 2.0',
    licenseUrl: 'https://github.com/grommet/grommet-icons/blob/master/LICENSE'
  },
  {
    name: 'Material Design Icons',
    url: 'https://google.github.io/material-design-icons/',
    license: 'Apache 2.0',
    licenseUrl: 'https://github.com/google/material-design-icons/blob/master/LICENSE'
  },
  {
    name: 'Visual Studio Code - Codicons',
    url: 'https://github.com/microsoft/vscode-codicons',
    license: 'CC BY 4.0',
    licenseUrl: 'https://github.com/microsoft/vscode-codicons/blob/master/LICENSE'
  }
];

const IconAttribution = ({ icon }) => (
  <ListItem>
    <ExternalLink href={icon.url} showIcon={true}>
      {icon.name}
    </ExternalLink>
    , <ExternalLink href={icon.licenseUrl}>{icon.license}</ExternalLink>
  </ListItem>
);

export const AboutModal = ({ appSettings }: { appSettings: AppSettings | null }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isConfetti, setConfetti] = useState(false);

  useEffect(() => {
    setConfetti(false);
  }, [isOpen]);

  return (
    <>
      <IexMenuItem onClick={onOpen}>About</IexMenuItem>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>About</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {isConfetti && <Confetti width={576} height={540} gravity={0.25} />}
              <VStack spacing="2rem" align="stretch">
                <HStack spacing="1rem" align="stretch">
                  <Image src="/assets/iex-logo.svg" objectFit="contain" maxW="30%" onClick={() => setConfetti(true)} />
                  <VStack flexGrow={1}>
                    <Image src="/assets/iex-name.svg" objectFit="contain" />

                    <Text fontWeight="200" fontSize="md" py="0.5rem">
                      Version {appSettings?.version}
                    </Text>
                  </VStack>
                </HStack>
                <VStack
                  spacing="1rem"
                  p="1rem"
                  align="stretch"
                  bg="snowstorm.300"
                  borderRadius="lg"
                  maxH="12rem"
                  overflowY="auto"
                >
                  <Text>
                    Insights Explorer is built with open-source projects in accordance to their license terms. For
                    complete details please refer to the
                    <ExternalLink href={appSettings?.iexScmUrl + '/blob/main/THIRD-PARTY-NOTICES.md'} showIcon={true}>
                      THIRD-PARTY-NOTICES.md
                    </ExternalLink>{' '}
                    file distributed with the source code for this project.
                  </Text>
                  <Text>
                    Icons used in this project have been sourced from the following:
                    <UnorderedList>
                      {icons.map((icon) => (
                        <IconAttribution icon={icon} key={icon.name} />
                      ))}
                    </UnorderedList>
                  </Text>
                </VStack>
                <HStack as={List} p="0.5rem" justify="space-evenly">
                  {appSettings?.externalDocUrl && (
                    <Link href={appSettings.externalDocUrl} fontWeight="bold">
                      Documentation
                    </Link>
                  )}

                  <ListItem fontWeight="bold">
                    <RouterLink to="/changelog">Changelog</RouterLink>
                  </ListItem>

                  {appSettings?.chatSettings && (
                    <ListItem fontWeight="bold">
                      <Link href={appSettings.chatSettings.url}>{appSettings.chatSettings.channel}</Link>
                    </ListItem>
                  )}
                </HStack>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="polar" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  );
};
