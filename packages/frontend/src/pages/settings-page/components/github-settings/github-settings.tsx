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
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '../../../../components/alert/alert';
import { Card } from '../../../../components/card/card';
import { FormLabel } from '../../../../components/form-label/form-label';
import type { User } from '../../../../models/generated/graphql';
import { formatFormError } from '../../../../shared/form-utils';
import { UserHealthCheck } from '../../../main-page/components/user-health-check/user-health-check';

import { GithubTokenInfo } from './github-token-info';

interface Props {
  user: User;
  onSubmit: (values) => void | Promise<any>;
  isSubmitting: boolean;
}

const GitHubPersonalAccessTokenInput = ({ name, defaultValue, form }) => {
  const {
    formState: { errors },
    register
  } = form;
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  return (
    <FormControl id={name} isRequired isInvalid={errors.githubPersonalAccessToken !== undefined} mb="1rem">
      <FormLabel>
        GitHub Personal Access Token
        <GithubTokenInfo mt="-0.25rem" />
      </FormLabel>
      <InputGroup size="md">
        <Input
          placeholder="GitHub Personal Access Token"
          type={show ? 'text' : 'password'}
          defaultValue={defaultValue}
          {...register(name, { required: true, maxLength: 40, pattern: /^\w{40}$/ })}
          errorBorderColor="red.300"
          onChange={(e) => (e.target.value = e.target.value.trim())}
        />
        <InputRightElement width="5rem">
          <Button h="1.75rem" size="sm" onClick={handleClick}>
            {show ? 'Hide' : 'Show'}
          </Button>
        </InputRightElement>
      </InputGroup>
      <FormHelperText>
        Insights Explorer will only use this token to perform user-initiated actions on your behalf.
      </FormHelperText>
      <FormErrorMessage>
        {formatFormError(errors[name], (error) => {
          if (error.type === 'pattern') {
            return 'This does not look like a valid GitHub token: it should be 40 hexadecimal characters.';
          }
        })}
      </FormErrorMessage>
    </FormControl>
  );
};

export const GitHubSettings = ({ user, onSubmit, isSubmitting }: Props) => {
  const { githubPersonalAccessToken } = user;

  const form = useForm({
    mode: 'onBlur',
    defaultValues: {
      githubPersonalAccessToken
    }
  });
  const { formState, handleSubmit, reset } = form;
  const { isDirty } = formState;

  const internalSubmit = async (values) => {
    await onSubmit(values);
    reset(values);
  };

  return (
    <Card as={Flex} flexDirection="column" p="1rem">
      <VStack spacing="1rem" align="stretch">
        <UserHealthCheck showPositiveChecks={true} />

        {isDirty && <Alert info="You have unsaved changes" />}

        <Heading as="h2" size="md">
          GitHub Integration
        </Heading>

        <Text fontSize="sm">
          Insights Explorer integrates with GitHub to store Insights, so creating or editing an Insight requires a
          GitHub account to be successfully linked here.
        </Text>
        <Text fontSize="sm">Note: Viewing Insights does not require a GitHub account.</Text>

        <Divider />

        <form onSubmit={handleSubmit(internalSubmit)}>
          <GitHubPersonalAccessTokenInput
            name="githubPersonalAccessToken"
            defaultValue={githubPersonalAccessToken}
            form={form}
          />

          <Button mt="0.5rem" variant="frost" isLoading={isSubmitting} type="submit">
            Save
          </Button>
        </form>
      </VStack>
    </Card>
  );
};
