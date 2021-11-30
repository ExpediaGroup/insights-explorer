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
  ButtonProps,
  IconButton,
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
  VStack,
  Heading
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';

import { ExternalLink } from '../../../../components/external-link/external-link';
import { iconFactoryAs } from '../../../../shared/icon-factory';
import { RootState } from '../../../../store/store';

export const GithubTokenInfo = (props: ButtonProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { appSettings } = useSelector((state: RootState) => state.app);

  return (
    <>
      <IconButton
        {...props}
        variant="ghost"
        aria-label="What's this?"
        size="sm"
        icon={iconFactoryAs('info')}
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>GitHub Personal Access Tokens</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing="1rem" align="stretch">
                <Text>
                  <ExternalLink
                    href="https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token"
                    showIcon={true}
                  >
                    GitHub Personal Access Tokens
                  </ExternalLink>{' '}
                  are an alternative to using passwords for authentication to GitHub when using the GitHub API or the
                  command line.
                </Text>
                <Text>
                  Insights Explorer needs a Personal Access Token to be able to perform GitHub actions on your behalf.
                  Any actions like creating or editing an Insight will be linked with your GitHub user.
                </Text>
                <Text>New Personal Access Tokens can be generated or deleted here:</Text>
                <Text textAlign="center">
                  <ExternalLink
                    href={`${appSettings?.gitHubSettings.url}/settings/tokens`}
                    showIcon={true}
                    color="frost.400"
                  >
                    {`${appSettings?.gitHubSettings.url}/settings/tokens`}
                  </ExternalLink>
                </Text>
                <Text>
                  <Heading as="h4" size="sm">
                    Required Scopes:
                  </Heading>
                  <UnorderedList pt="0.5rem" pl="1rem">
                    <ListItem>repo</ListItem>
                  </UnorderedList>
                </Text>
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
