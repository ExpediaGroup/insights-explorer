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

import { useBreakpointValue } from '@chakra-ui/media-query';
import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Grid,
  GridItem,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import CreatableSelect from 'react-select/creatable';
import titleize from 'titleize';
import { gql, useQuery } from 'urql';

import { Alert } from '../../../../components/alert/alert';
import { Card } from '../../../../components/card/card';
import { FileUploadArea } from '../../../../components/file-upload-area/file-upload-area';
import { FormLabel } from '../../../../components/form-label/form-label';
import { MarkdownSplitEditor } from '../../../../components/markdown-split-editor/markdown-split-editor';
import type {
  AutocompleteProfileQuery,
  AvatarUploadResult,
  UpdateUserInput,
  User
} from '../../../../models/generated/graphql';
import { chatIcon } from '../../../../shared/chat-icon';
import { formatFormError } from '../../../../shared/form-utils';
import { iconFactoryAs } from '../../../../shared/icon-factory';
import type { RootState } from '../../../../store/store';
import { urqlClient } from '../../../../urql';

const AUTOCOMPLETE_QUERY = gql`
  query AutocompleteProfile {
    autocomplete {
      skills {
        value
        occurrences
      }
      teams {
        value
        occurrences
      }
    }
  }
`;

const AVATAR_UPLOAD_MUTATION = gql`
  mutation AvatarUpload($size: Float!, $file: Upload!) {
    uploadUserAvatar(size: $size, file: $file) {
      avatar
      avatarUrl
    }
  }
`;

interface Props {
  user: User;
  onSubmit: (values) => void | Promise<any>;
  isSubmitting: boolean;
}

export const ProfileSettings = ({ user, onSubmit, isSubmitting }: Props) => {
  const { appSettings } = useSelector((state: RootState) => state.app);

  const profileImgSize = useBreakpointValue({ base: 'lg', md: '2xl' });

  const form = useForm<UpdateUserInput>({
    mode: 'onBlur',
    defaultValues: {
      bio: user.bio,
      chatHandle: user.chatHandle,
      currentStatus: user.currentStatus,
      location: user.location,
      readme: user.readme,
      skills: user.skills,
      team: user.team,
      title: user.title,
      userName: user.userName
    }
  });
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setValue
  } = form;

  const [uploading, setUploading] = useState(false);

  // Load autocomplete values to populate filters
  const [{ data: autocompleteData }] = useQuery<AutocompleteProfileQuery>({
    query: AUTOCOMPLETE_QUERY
  });

  const availableSkills = autocompleteData?.autocomplete?.skills?.map(({ value }) => ({ value, label: value })) ?? [];
  const availableTeams = autocompleteData?.autocomplete?.teams?.map(({ value }) => ({ value, label: value })) ?? [];

  // Tracks newly-uploaded avatars that aren't saved
  const [effectiveAvatarUrl, setEffectiveAvatarUrl] = useState(user.avatarUrl);

  useEffect(() => {
    register('avatar');
  }, [register]);

  const internalSubmit = async (values) => {
    await onSubmit(values);
    reset(values);
  };

  const onDropAvatar = useCallback(
    async (acceptedFiles: any[]) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      setUploading(true);

      const file = acceptedFiles[0];
      console.log(file);

      // Upload file to IEX storage
      const { data } = await urqlClient
        .mutation(AVATAR_UPLOAD_MUTATION, {
          size: file.size,
          file: file
        })
        .toPromise();

      const result: AvatarUploadResult = data.uploadUserAvatar;
      setValue('avatar', result.avatar, { shouldDirty: true });
      setEffectiveAvatarUrl(result.avatarUrl);

      setUploading(false);
    },
    [setValue]
  );

  return (
    <Card as={Flex} flexDirection="column" p="1rem">
      {isDirty && <Alert info="You have unsaved changes" mb="1rem" />}

      <form onSubmit={handleSubmit(internalSubmit)}>
        <Flex mb="3rem" justify="space-between">
          <Box>
            <Heading>{user.displayName}</Heading>
            <Text>{user.email}</Text>
          </Box>

          {uploading && (
            <VStack spacing="0.5rem" align="center">
              <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
              <Text fontSize="sm">Uploading...</Text>
            </VStack>
          )}
          {!uploading && (
            <Flex direction="column" align="center">
              <FileUploadArea
                onDrop={onDropAvatar}
                element={<Avatar src={effectiveAvatarUrl} size={profileImgSize} name={user.displayName} />}
              />
              <Text as="em" fontSize="xs">
                Click to edit.
              </Text>
            </Flex>
          )}
        </Flex>

        <Grid templateColumns="1fr 1fr" gap="1rem">
          <GridItem colSpan={2}>
            <FormControl id="userName" isRequired={true} isInvalid={errors.userName !== undefined}>
              <FormLabel>User Name</FormLabel>
              <Input
                placeholder="User Name"
                defaultValue={user.userName}
                errorBorderColor="red.300"
                {...register('userName', { required: true, pattern: /^[\dA-Za-z]+$/ })}
                onChange={(e) => (e.target.value = e.target.value.trim().toLowerCase())}
              />
              <FormHelperText>Your user name appears in your profile URL and can be used for @mentions.</FormHelperText>
              <FormErrorMessage>{formatFormError(errors.userName)}</FormErrorMessage>
            </FormControl>
          </GridItem>

          <GridItem colSpan={2}>
            <FormControl id="currentStatus" isInvalid={errors.currentStatus !== undefined}>
              <FormLabel>Current Status</FormLabel>
              <Input
                placeholder="Current Status"
                defaultValue={user.currentStatus}
                errorBorderColor="red.300"
                {...register('currentStatus', { required: false, maxLength: 192 })}
              />
              <FormHelperText>How are you doing? What are you up to?</FormHelperText>
            </FormControl>
          </GridItem>

          <GridItem colSpan={2}>
            <FormControl id="bio" isInvalid={errors.bio !== undefined}>
              <FormLabel>Bio</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={iconFactoryAs('biography', { color: 'frost.400' })} />
                <Input
                  placeholder="About Me"
                  defaultValue={user.bio}
                  errorBorderColor="red.300"
                  {...register('bio', { maxLength: 256 })}
                />
              </InputGroup>
              <FormHelperText>One-liner about yourself.</FormHelperText>
            </FormControl>
          </GridItem>

          <GridItem colSpan={{ base: 2, xl: 1 }}>
            <FormControl id="title" isInvalid={errors.title !== undefined}>
              <FormLabel>Job Title</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={iconFactoryAs('briefcase', { color: 'frost.400' })} />
                <Input
                  placeholder="Job Title"
                  defaultValue={user.title}
                  errorBorderColor="red.300"
                  {...register('title', { maxLength: 256 })}
                />
              </InputGroup>
              <FormHelperText>What do you do?</FormHelperText>
            </FormControl>
          </GridItem>

          <GridItem colSpan={{ base: 2, xl: 1 }}>
            <FormControl id="team" isInvalid={errors.team !== undefined}>
              <FormLabel>Team</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={iconFactoryAs('team', { color: 'frost.400' })} />
                <Controller
                  control={control}
                  name="team"
                  defaultValue={user.team}
                  render={({ field: { onChange, value } }) => (
                    <CreatableSelect
                      inputId="team"
                      options={availableTeams}
                      onChange={(e) => {
                        if (e) {
                          onChange(e.value);
                        }
                      }}
                      value={{ value, label: value }}
                      menuPortalTarget={document.body}
                      styles={{
                        container: (base) => ({ ...base, width: '100%' }),
                        valueContainer: (base) => ({ ...base, paddingLeft: '40px' })
                      }}
                    />
                  )}
                />
              </InputGroup>
              <FormHelperText>What team are you on?</FormHelperText>
            </FormControl>
          </GridItem>

          <GridItem colSpan={{ base: 2, xl: 1 }}>
            <FormControl id="location" isInvalid={errors.location !== undefined}>
              <FormLabel>Location</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={iconFactoryAs('location', { color: 'frost.400' })} />
                <Input
                  placeholder="Location"
                  defaultValue={user.location}
                  errorBorderColor="red.300"
                  {...register('location', { maxLength: 256 })}
                />
              </InputGroup>
              <FormHelperText>Where are you located?</FormHelperText>
            </FormControl>
          </GridItem>

          {appSettings?.chatSettings && (
            <GridItem colSpan={{ base: 2, xl: 1 }}>
              <FormControl id="chatHandle" isInvalid={errors.chatHandle !== undefined}>
                <FormLabel>{titleize(appSettings.chatSettings.provider)} Handle</FormLabel>
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<Icon as={chatIcon(appSettings.chatSettings.provider)} color="frost.400" />}
                  />
                  <Input
                    placeholder={titleize(appSettings.chatSettings.provider) + ' Handle'}
                    defaultValue={user.chatHandle}
                    errorBorderColor="red.300"
                    {...register('chatHandle', { maxLength: 256 })}
                  />
                </InputGroup>
                <FormHelperText>Let people find you on {titleize(appSettings.chatSettings.provider)}.</FormHelperText>
              </FormControl>
            </GridItem>
          )}

          <GridItem colSpan={2}>
            <FormControl id="skills" isInvalid={errors.skills !== undefined} mb="1rem">
              <FormLabel>Skills / Interests</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" children={iconFactoryAs('team', { color: 'frost.400' })} />
                <Controller
                  control={control}
                  name="skills"
                  defaultValue={user.skills}
                  render={({ field: { onChange, value } }) => (
                    <CreatableSelect
                      inputId="skills"
                      isMulti
                      isClearable
                      options={availableSkills}
                      onChange={(e) => {
                        let skills: string[] = [];
                        if (e != null) {
                          skills = e.map((v) => v.value.trim().toLowerCase().replaceAll(/\s/g, '-'));
                        }
                        setValue('skills', skills);
                      }}
                      value={(value ?? []).map((tag: string) => ({ value: tag, label: tag }))}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 11 }),
                        container: (base) => ({ ...base, width: '100%' }),
                        valueContainer: (base) => ({ ...base, paddingLeft: '40px' })
                      }}
                      menuPortalTarget={document.body}
                    />
                  )}
                />
              </InputGroup>
              <FormHelperText>What are you interested in or skilled at?</FormHelperText>
            </FormControl>
          </GridItem>
        </Grid>

        <FormControl id="readme" mt="1rem">
          <FormLabel>About Me</FormLabel>
          <Controller
            control={control}
            name="readme"
            defaultValue={user.readme}
            render={({ field: { onChange, value } }) => (
              <MarkdownSplitEditor onChange={onChange} contents={user.readme ?? ''} mt="-1rem" />
            )}
          />
          <FormHelperText>Markdown-enabled personal README.md document.</FormHelperText>
        </FormControl>

        <Button mt="0.5rem" variant="frost" isLoading={isSubmitting} type="submit">
          Save
        </Button>
      </form>
    </Card>
  );
};
