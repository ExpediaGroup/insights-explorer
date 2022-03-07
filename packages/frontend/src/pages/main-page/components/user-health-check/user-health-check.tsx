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
import { Alert as ChakraAlert, AlertIcon, Badge, Box, BoxProps, Button, Stack, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Alert } from '../../../../components/alert/alert';
import { ExternalLink } from '../../../../components/external-link/external-link';
import { Link as RouterLink } from '../../../../components/link/link';
import { RootState } from '../../../../store/store';
import { executeHealthCheck } from '../../../../store/user.slice';

const HealthCheckAlert = ({ children, allowRecheck = true }) => {
  const dispatch = useDispatch();

  const onRecheck = () => dispatch(executeHealthCheck());

  const buttonSize = useBreakpointValue({ base: 'xs', md: 'sm' });

  return (
    <ChakraAlert status="warning" borderRadius="0.25rem" mb="1rem" alignItems="flex-start" wordBreak="break-word">
      <AlertIcon flexShrink={0} />
      <Stack direction={{ base: 'column', md: 'row' }} spacing="0.5rem" align="flex-start">
        <Text as="strong" flexShrink={0}>
          Warning:
        </Text>
        {children}
        {allowRecheck && (
          <Button size={buttonSize} bg="snowstorm.100" flexShrink={0} onClick={onRecheck}>
            Recheck
          </Button>
        )}
      </Stack>
    </ChakraAlert>
  );
};

/**
 * Displays alerts for failed health checks.
 * This means there is an issue with the user's settings.
 */
export const UserHealthCheck = ({
  showPositiveChecks = false,
  ...boxProps
}: { showPositiveChecks?: boolean } & BoxProps) => {
  const dispatch = useDispatch();
  const { loggedIn, healthCheck } = useSelector((state: RootState) => state.user);
  const { appSettings } = useSelector((state: RootState) => state.app);

  useEffect(() => {
    // Automatically re-run health checks whenever login state changes
    dispatch(executeHealthCheck());
  }, [dispatch, loggedIn]);

  if (healthCheck === undefined) {
    return null;
  }

  const gitHubTokenValid =
    (healthCheck.hasGitHubToken &&
      healthCheck.isGitHubTokenValid &&
      healthCheck.hasGitHubEmail &&
      healthCheck.doesGitHubEmailMatch &&
      healthCheck.hasRequiredScopes) ||
    false;

  return (
    <Box {...boxProps} fontSize={{ base: 'sm', md: 'md' }}>
      {showPositiveChecks && gitHubTokenValid && <Alert success="Your GitHub Personal Access Token is valid" />}
      {!healthCheck.hasGitHubToken && (
        <HealthCheckAlert allowRecheck={false}>
          <Box>
            <Text mb="1rem">
              You need to provide a GitHub Personal Access Token before you can create or edit Insights. Go to the{' '}
              <RouterLink to="/settings/github">Settings Page</RouterLink> to provide a valid token.
            </Text>
            <Text>
              New tokens can be created on the{' '}
              <ExternalLink showIcon={true} href={`${appSettings?.gitHubSettings.url}/settings/tokens`}>
                GitHub Personal Access Tokens page
              </ExternalLink>
              .
            </Text>
          </Box>
        </HealthCheckAlert>
      )}
      {healthCheck.hasGitHubToken && (
        <>
          {healthCheck.isGitHubTokenValid === false && (
            <HealthCheckAlert allowRecheck={false}>
              <Box>
                <Text mb="1rem">
                  The GitHub Personal Access Token you have configured is not valid. Go to the{' '}
                  <RouterLink to="/settings/github">Settings Page</RouterLink> to provide a valid token.
                </Text>
                <Text>
                  New tokens can be created on the{' '}
                  <ExternalLink showIcon={true} href={`${appSettings?.gitHubSettings.url}/settings/tokens`}>
                    GitHub Personal Access Tokens page
                  </ExternalLink>
                  .
                </Text>
              </Box>
            </HealthCheckAlert>
          )}
          {healthCheck.hasGitHubEmail === false && (
            <HealthCheckAlert>
              <Text>
                Your GitHub account does not have a public email configured, so Insight changes may not be correctly
                attributed to you. Please go to the{' '}
                <ExternalLink showIcon={true} href={`${appSettings?.gitHubSettings.url}/settings/profile`}>
                  GitHub Profile settings page
                </ExternalLink>{' '}
                to configure a public email address.
              </Text>
            </HealthCheckAlert>
          )}
          {healthCheck.hasGitHubEmail === true && healthCheck.doesGitHubEmailMatch === false && (
            <HealthCheckAlert>
              <Text>
                Your GitHub account's public email doesn't match your login email, which may cause issues with correctly
                attributing your work. Please update your public email setting in your{' '}
                <ExternalLink showIcon={true} href={`${appSettings?.gitHubSettings.url}/settings/profile`}>
                  GitHub public profile
                </ExternalLink>{' '}
                so it matches your login email.
              </Text>
            </HealthCheckAlert>
          )}
          {healthCheck.hasRequiredScopes === false && (
            <HealthCheckAlert>
              <Text>
                Your GitHub token requires the <Badge bg="snowstorm.100">repo</Badge> scope to create or edit Insights.
                Please go to the{' '}
                <ExternalLink showIcon={true} href={`${appSettings?.gitHubSettings.url}/settings/tokens`}>
                  GitHub Personal Access Tokens page
                </ExternalLink>{' '}
                to add this scope to your token.
              </Text>
            </HealthCheckAlert>
          )}
        </>
      )}
    </Box>
  );
};
