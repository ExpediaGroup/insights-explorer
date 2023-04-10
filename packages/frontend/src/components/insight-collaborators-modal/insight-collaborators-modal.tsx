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
  Button,
  Flex,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Spinner,
  Text,
  VStack,
  Badge,
  Divider,
  FormControl,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { gql, useMutation, useQuery } from 'urql';

import { iconFactoryAs } from '../../shared/icon-factory';
import type { RootState } from '../../store/store';
import { Alert } from '../alert/alert';
import { DeleteIconButton } from '../delete-icon-button/delete-icon-button';
import { ExternalLink } from '../external-link/external-link';
import { Link as RouterLink } from '../link/link';

import { PermissionMenu } from './permission-menu';

const COLLABORATORS_FRAGMENT = gql`
  fragment CollaboratorFields on Insight {
    id
    repository {
      url
    }
    collaborators {
      edges {
        permission
        node {
          id
          userName
          displayName
          avatarUrl
        }
      }
    }
  }
`;

const INSIGHT_COLLABORATORS_QUERY = gql`
  ${COLLABORATORS_FRAGMENT}
  query InsightCollaborators($id: ID!) {
    insight(insightId: $id) {
      ...CollaboratorFields
    }
  }
`;

const USERS_QUERY = gql`
  query Users {
    users {
      id
      userName
      displayName
      avatarUrl
      githubProfile {
        login
      }
    }
  }
`;

const ADD_COLLABORATORS_MUTATION = gql`
  ${COLLABORATORS_FRAGMENT}
  mutation AddCollaborator($insightId: ID!, $userId: ID!, $permission: String!) {
    addCollaborator(insightId: $insightId, userId: $userId, permission: $permission) {
      ...CollaboratorFields
    }
  }
`;

const REMOVE_COLLABORATORS_MUTATION = gql`
  ${COLLABORATORS_FRAGMENT}
  mutation RemoveCollaborator($insightId: ID!, $userId: ID!) {
    removeCollaborator(insightId: $insightId, userId: $userId) {
      ...CollaboratorFields
    }
  }
`;

const InsightCollaboratorsModalInternal = ({ insightId }) => {
  const { userInfo } = useSelector((state: RootState) => state.user);

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      userId: null
    }
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset
  } = form;

  const [{ data, error, fetching: collaboratorsFetching }] = useQuery({
    query: INSIGHT_COLLABORATORS_QUERY,
    variables: { id: insightId }
  });

  const insight = data?.insight;
  const edges = insight?.collaborators?.edges;

  const [{ data: usersData }] = useQuery({
    query: USERS_QUERY
  });

  const availableUsers =
    usersData?.users
      .filter((u) => u.githubProfile !== null)
      .filter((u) => edges === undefined || !edges.map((e) => e.node.id).includes(u.id))
      .sort((a, b) => (a.displayName ?? a.userName) > (b.displayName ?? b.userName))
      .map((u) => ({ value: u.id, label: u.displayName ?? u.userName })) ?? [];

  const [{ fetching: addCollaboratorFetching }, addCollaborator] = useMutation(ADD_COLLABORATORS_MUTATION);
  const [{ fetching: removeCollaboratorFetching }, removeCollaborator] = useMutation(REMOVE_COLLABORATORS_MUTATION);

  const onAddUser = async ({ userId }) => {
    await addCollaborator({
      insightId,
      userId,
      permission: 'WRITE'
    });
    reset();
  };

  const onRemoveUser = async (userId) => {
    await removeCollaborator({
      insightId,
      userId
    });
  };

  const onChangePermission = async (userId, permission) => {
    await addCollaborator({
      insightId,
      userId,
      permission
    });
  };

  const fetching = collaboratorsFetching || addCollaboratorFetching || removeCollaboratorFetching;

  return (
    <VStack spacing="1rem" align="stretch">
      <Text fontSize="sm">
        Collaborators can make changes with the <Badge>WRITE</Badge> role, or manage collaborators with the{' '}
        <Badge>ADMIN</Badge> role.
      </Text>

      <Divider />

      {error && <Alert error={`Error: ${error}`} />}

      {fetching && (
        <Flex justify="space-around">
          <Spinner thickness="4px" speed="0.65s" mt="6px" emptyColor="snowstorm.300" color="frost.200" size="lg" />
        </Flex>
      )}

      {!fetching && (
        <>
          {edges && (
            <>
              {edges.length === 0 && (
                <Text textAlign="center" fontStyle="italic" color="polar.600">
                  No Collaborators found!
                </Text>
              )}

              {edges
                .sort((a, b) => a.permission > b.permission)
                .map(({ permission, node }) => {
                  const simplePermission = permission === 'MAINTAIN' ? 'WRITE' : permission;
                  return (
                    <HStack key={node.userName} align="center">
                      <Avatar name={node.displayName} src={node.avatarUrl} size="sm" />

                      <RouterLink to={`/profile/${node.userName}`}>
                        <Text fontWeight="bold" fontSize="md">
                          {node.displayName}
                        </Text>
                      </RouterLink>

                      <HStack flexGrow={2} justify="flex-end">
                        <PermissionMenu
                          permission={simplePermission}
                          onChange={(p) => onChangePermission(node.id, p)}
                          isDisabled={node.id === userInfo?.id}
                        />

                        <DeleteIconButton onClick={() => onRemoveUser(node.id)} isDisabled={node.id === userInfo?.id} />
                      </HStack>
                    </HStack>
                  );
                })}
            </>
          )}

          <Divider />
          <HStack as="form" onSubmit={handleSubmit(onAddUser)}>
            <FormControl id="userId" isInvalid={errors.userId !== undefined}>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={iconFactoryAs('user', { color: 'frost.400' })} />
                <Controller
                  control={control}
                  name="userId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      inputId="userId"
                      options={availableUsers}
                      onChange={(e) => onChange(e.value)}
                      value={availableUsers && value && availableUsers.find((u) => u.id === value)}
                      styles={{
                        menu: (base) => ({ ...base, zIndex: 11 }),
                        container: (base) => ({ ...base, width: '100%' }),
                        valueContainer: (base) => ({ ...base, paddingLeft: '40px' }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 })
                      }}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
              </InputGroup>
            </FormControl>

            <Button size="md" variant="frost" type="submit">
              Add
            </Button>
          </HStack>
        </>
      )}

      <Divider />

      <Text fontSize="xs">
        Collaborators with access through GitHub Teams or Organization permissions are not shown. Manage GitHub Teams
        permissions for the repository{' '}
        <ExternalLink
          href={insight?.repository.url + '/settings/access'}
          isExternal={true}
          showIcon={true}
          display="inline-block"
        >
          here
        </ExternalLink>
        .
      </Text>
    </VStack>
  );
};

interface Props {
  insightId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InsightCollaboratorsModal = ({ insightId, isOpen, onClose }: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} scrollBehavior="inside" size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Insight Collaborators</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <InsightCollaboratorsModalInternal insightId={insightId} />
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="polar" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
