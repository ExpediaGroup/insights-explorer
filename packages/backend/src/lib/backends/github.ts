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

import { getLogger } from '@iex/shared/logger';
import { graphql as GQ } from '@octokit/graphql';
import { graphql } from '@octokit/graphql/dist-types/types';
import { Octokit } from '@octokit/rest';
import { OctokitResponse } from '@octokit/types';

import {
  UpdateRepositoryInput,
  UpdateTopicsInput,
  CreateRepositoryInput,
  RepositoryOwner,
  GitHubRepository,
  CloneTemplateRepositoryInput,
  GitHubRepositoryStub,
  GitHubRepositoryExists,
  GitHubUser,
  GitHubTokenMetadata,
  GitHubRepositoryPermission,
  GitHubRepositoryCollaboratorEdge,
  GitHubRepositoryHistoryEdge,
  GitHubCollaboratorAffiliation
} from '../../models/backends/github';
import { sleep } from '../../shared/util';

const logger = getLogger('github');

/*
 * GitHub GraphQL client configuration
 */
export function makeGraphql(token: string = process.env.GITHUB_ACCESS_TOKEN!): graphql {
  if (token == null || token === '') {
    logger.error('GitHub token is not configured; please provide the `GITHUB_ACCESS_TOKEN` environment variable.');
    throw new Error('No GitHub token configured');
  }

  return GQ.defaults({
    baseUrl: process.env.GITHUB_GRAPHQL_API_URL === '' ? undefined : process.env.GITHUB_GRAPHQL_API_URL,
    mediaType: {
      previews: ['bane']
    },
    headers: {
      authorization: `token ${token}`
    }
  });
}

/*
 * GitHub client configuration
 */
export function makeOctokit(token: string = process.env.GITHUB_ACCESS_TOKEN!): Octokit {
  if (token == null || token === '') {
    logger.error('GitHub token is not configured; please provide the `GITHUB_ACCESS_TOKEN` environment variable.');
    throw new Error('No GitHub token configured');
  }

  return new Octokit({
    auth: token,
    userAgent: `iex ${process.env.IEX_VERSION || '0.0.0'}`,
    baseUrl: process.env.GITHUB_REST_API_URL === '' ? undefined : process.env.GITHUB_REST_API_URL,
    log: {
      debug: logger.debug.bind(logger),
      info: logger.info.bind(logger),
      warn: logger.warn.bind(logger),
      error: logger.error.bind(logger)
    },
    previews: ['mercy-preview']
  });
}

/**
 * Runs an Octokit API request repeatedly if a 202 Accepted response is returned.
 * @param fn
 * @param retriesLeft
 */
export async function withRetries<T>(
  fn: () => Promise<OctokitResponse<T>>,
  retriesLeft = 5,
  sleepDuration = 5000
): Promise<T> {
  const result = await fn();

  if (result.status === 200) {
    return result.data;
  }

  if (result.status === 202 || result.status == 204) {
    if (retriesLeft > 0) {
      logger.debug(`${result.status} response, retrying request...`);
      await sleep(sleepDuration);
      return withRetries(fn, retriesLeft - 1, sleepDuration * 1.25);
    }

    throw new Error('Unable to query GitHub successfully before retries ran out...');
  }

  logger.error(JSON.stringify(result, null, 2));
  throw new Error('Error in withRetries() request');
}

//
// Queries
//
export async function doesRepositoryExist(
  owner: string,
  repo: string
): Promise<{ repository?: GitHubRepositoryExists; exists: boolean }> {
  try {
    const { repository }: { repository: GitHubRepositoryExists } = await makeGraphql()({
      query: `query repository($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          id
          nameWithOwner
          isArchived
        }
      }`,
      owner,
      repo
    });

    logger.info('Checked Repository existance for ' + repository.nameWithOwner);

    if (repository) {
      return { repository, exists: true };
    }
    return { exists: false };
  } catch (error: any) {
    if (error.errors && error.errors[0] && error.errors[0].type === 'NOT_FOUND') {
      return { exists: false };
    } else {
      throw error;
    }
  }
}

export async function getRepository(owner: string, repo: string): Promise<GitHubRepository> {
  const { repository }: { repository: GitHubRepository } = await makeGraphql()({
    query: `query repository($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        id
        name
        nameWithOwner
        url
        homepageUrl
        description
        createdAt
        updatedAt
        forkCount
        stargazers {
          totalCount
        }
        owner {
          __typename
          login
          avatarUrl
          ... on User {
            id
          }
          ... on Organization {
            id
          }
        }
        repositoryTopics(first: 10) {
          edges {
            node {
              topic {
                name
              }
            }
          }
        }
        defaultBranchRef {
          name
        }
        isArchived
      }
    }`,
    owner,
    repo
  });

  logger.info('Retrieved Repository details for ' + repository.nameWithOwner);

  repository.cloneUrl = repository.url + '.git';

  return repository;
}

export async function getRepositoryPermissions(
  owner: string,
  repo: string,
  token: string
): Promise<GitHubRepositoryPermission> {
  try {
    const { repository } = await makeGraphql(token)({
      query: `query repository($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          viewerPermission
        }
      }`,
      owner,
      repo
    });

    logger.info(`Retrieved Repository permissions of ${repository.viewerPermission} on ${owner}/${repo}`);

    return repository.viewerPermission as GitHubRepositoryPermission;
  } catch (error: any) {
    logger.debug(`Unable to retrieve Repository permissions: ${error}`);

    return 'NONE';
  }
}

export async function getRepositoryOwner(login: string): Promise<RepositoryOwner> {
  const { repositoryOwner }: { repositoryOwner: RepositoryOwner } = await makeGraphql()({
    query: `query repositoryOwner($login: String!) {
      repositoryOwner(login: $login) {
        ... on Node {
          id
        }
        avatarUrl
        login
        url
      }
    }`,
    login
  });

  return repositoryOwner;
}

export async function getUser(login: string): Promise<GitHubUser> {
  const { user }: { user: GitHubUser } = await makeGraphql()({
    query: `query user($login: String!, $defaultOrg: String!) {
      user(login: $login) {
        id
        databaseId
        name
        email
        avatarUrl
        url
        bio
        location
        status {
          message
          emoji
        }
        defaultOrg: organization(login: $defaultOrg) {
          id
        }
      }
    }`,
    login,
    defaultOrg: process.env.GITHUB_DEFAULT_ORG
  });

  return user;
}

/**
 * This function serves two purposes: it retrieves the user login from a given
 * token, and it returns the scopes for that token.
 *
 * The login can be used in other API calls for this user.
 */
export async function getTokenMetadata(token: string): Promise<GitHubTokenMetadata> {
  const { data, headers } = await makeOctokit(token).users.getAuthenticated();

  return {
    login: data.login,
    scopes: (headers['x-oauth-scopes'] || '').split(',').map((s) => s.trim())
  };
}

//
// Mutations
//

export async function createRepository(token: string, input: CreateRepositoryInput): Promise<GitHubRepository> {
  const { createRepository } = await makeGraphql(token)({
    query: `mutation createRepository($input: CreateRepositoryInput!) {
      createRepository(input: $input) {
        repository {
          id
          name
          nameWithOwner
          url
          owner {
            id
            login
          }
        }
      }
    }`,
    input
  });

  logger.info(`Successfully created GitHub Repository ${input.ownerId}/${input.name}`);
  logger.debug(JSON.stringify(createRepository, null, 2));

  const repository: GitHubRepository = createRepository.repository;
  repository.cloneUrl = repository.url + '.git';

  return repository;
}

export async function cloneTemplateRepository(
  token: string,
  input: CloneTemplateRepositoryInput
): Promise<GitHubRepository> {
  const { cloneTemplateRepository } = await makeGraphql(token)({
    query: `mutation cloneTemplateRepository($input: CloneTemplateRepositoryInput!) {
      cloneTemplateRepository(input: $input) {
        repository {
          id
          name
          nameWithOwner
          url
          owner {
            id
            login
          }
        }
      }
    }`,
    input
  });

  logger.info(
    `Successfully cloned GitHub Repository ${input.ownerId}/${input.name} from template ${input.repositoryId}`
  );
  logger.debug(JSON.stringify(cloneTemplateRepository, null, 2));
  const repository: GitHubRepository = cloneTemplateRepository.repository;
  repository.cloneUrl = repository.url + '.git';

  return repository;
}

export async function updateRepository(token: string, input: UpdateRepositoryInput): Promise<GitHubRepositoryStub> {
  const { updateRepository } = await makeGraphql(token)({
    query: `mutation updateRepository($input: UpdateRepositoryInput!) {
      updateRepository(input: $input) {
        repository {
          id
          name
          nameWithOwner
          url
        }
      }
    }`,
    input
  });

  logger.info(`Successfully updated GitHub Repository ${input.repositoryId}`);
  const repository: GitHubRepository = updateRepository.repository;
  repository.cloneUrl = repository.url + '.git';

  return repository;
}

export async function updateTopics(token: string, input: UpdateTopicsInput): Promise<GitHubRepositoryStub> {
  const repository = (await makeGraphql(token)({
    query: `mutation updateTopics($input: UpdateTopicsInput!) {
      updateTopics(input: $input) {
        repository {
          id
          name
          nameWithOwner
          url
        }
      }
    }`,
    input
  })) as GitHubRepositoryStub;

  logger.info(`Successfully updated GitHub Repository topics ${input.repositoryId}`);
  return repository;
}

export async function addCollaborator(
  token: string,
  owner: string,
  repo: string,
  username: string,
  permission?: 'pull' | 'push' | 'admin' | 'maintain' | 'triage' | undefined
): Promise<void> {
  // GraphQL API doesn't have an equivalent mutation for this.
  await makeOctokit(token).repos.addCollaborator({
    owner,
    repo,
    username,
    permission
  });

  logger.info(`Successfully added ${username} to ${owner}/${repo}`);
}

export async function removeCollaborator(token: string, owner: string, repo: string, username: string): Promise<void> {
  // GraphQL API doesn't have an equivalent mutation for this.
  await makeOctokit(token).repos.removeCollaborator({
    owner,
    repo,
    username
  });

  logger.info(`Successfully removed ${username} from ${owner}/${repo}`);
}

export async function listWebhooks(owner: string, repo: string): Promise<void> {
  // GraphQL API doesn't have an equivalent mutation for this.
  const webhooks = await makeOctokit().repos.listWebhooks({
    owner,
    repo
  });

  logger.info(`Wehbooks for ${owner}/${repo}: ${JSON.stringify(webhooks, null, 2)}`);
}

export async function createIexWebhook(token: string, owner: string, repo: string): Promise<void> {
  // GraphQL API doesn't have an equivalent mutation for this.
  const webhooks = await makeOctokit(token).repos.createWebhook({
    owner,
    repo,
    name: 'web',
    config: {
      url: process.env.PUBLIC_URL + '/api/v1/webhook',
      content_type: 'json',
      insecure_ssl: '0'
    },
    events: ['*'],
    active: true
  });

  logger.info(`Wehbooks for ${owner}/${repo}: ${JSON.stringify(webhooks, null, 2)}`);
}

export async function archiveRepository(token: string, repositoryId: string): Promise<GitHubRepositoryStub> {
  const repository = (await makeGraphql(token)({
    query: `mutation archiveRepository($input: ArchiveRepositoryInput!) {
      archiveRepository(input: $input) {
        repository {
          id
          name
          nameWithOwner
          url
        }
      }
    }`,
    input: {
      repositoryId
    }
  })) as GitHubRepositoryStub;

  logger.info(`Successfully archived GitHub repository ${repositoryId}`);
  return repository;
}

export async function addUserToOrganization(token: string, org: string, username: string): Promise<void> {
  // GraphQL API doesn't have an equivalent mutation for this.
  await makeOctokit(token).orgs.setMembershipForUser({
    org,
    username,
    role: 'member'
  });

  logger.info(`Successfully added ${username} to ${org}`);
}

export async function getCommitList(owner: string, repo: string): Promise<GitHubRepositoryHistoryEdge[]> {
  let hasNextPage = true;
  let endCursor: string | undefined;
  const edges: GitHubRepositoryHistoryEdge[] = [];

  while (hasNextPage === true) {
    try {
      const { repository }: { repository: GitHubRepository } = await makeGraphql()({
        query: `query commitList($owner: String!, $repo: String!${endCursor ? ', $after: String!' : ''}) {
          repository(owner: $owner, name: $repo) {
            id
            name
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first:100 ${endCursor ? ', after: $after' : ''}) {
                    pageInfo {
                      endCursor
                      hasNextPage
                    }
                    edges {
                      node {
                        ... on Commit {
                          message
                          author {
                            name
                            user {
                              login
                              name
                            }
                          }
                          committedDate
                          changedFiles
                          additions
                          deletions
                          abbreviatedOid
                          oid
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
        owner,
        repo,
        after: endCursor
      });

      const commits = repository!.defaultBranchRef!.target?.history;
      hasNextPage = commits.pageInfo!.hasNextPage;
      endCursor = commits.pageInfo!.endCursor;
      logger.info(`Retrieved ${commits.edges.length} commits...`);
      edges.push(...commits.edges);
    } catch (error: any) {
      hasNextPage = false;
      logger.debug(`Unable to retrieve Repository commits. ${error}`);
    }
  }

  logger.info(`${edges.length} Retrieved commits for ${owner}/${repo}`);

  return edges;
}

export async function getCollaborators(
  owner: string,
  repo: string,
  affiliation: GitHubCollaboratorAffiliation = 'DIRECT'
): Promise<GitHubRepositoryCollaboratorEdge[]> {
  let hasNextPage = true;
  let endCursor: string | undefined;
  const edges: GitHubRepositoryCollaboratorEdge[] = [];

  while (hasNextPage === true) {
    try {
      const { repository }: { repository: GitHubRepository } = await makeGraphql()({
        query: `query collaborators($owner: String!, $repo: String!${endCursor ? ', $after: String!' : ''}) {
          repository(owner: $owner, name: $repo) {
            collaborators(first: 100, affiliation: ${affiliation}${endCursor ? ', after: $after' : ''}) {
              pageInfo {
                endCursor
                hasNextPage
              }
              edges {
                permission
                node {
                  id
                  login
                  email
                  __typename
                }
              }
            }
          }
        }`,
        owner,
        repo,
        after: endCursor
      });

      const collaborators = repository.collaborators;
      hasNextPage = collaborators.pageInfo!.hasNextPage;
      endCursor = collaborators.pageInfo!.endCursor;
      logger.info(`Retrieved ${collaborators.edges.length} collaborators...`);
      edges.push(...collaborators.edges.filter((edge: GitHubRepositoryCollaboratorEdge) => edge.permission !== 'READ'));
    } catch (error: any) {
      hasNextPage = false;
      logger.debug(`Unable to retrieve Repository collaborators: ${error}`);
    }
  }

  logger.info(`${edges.length} Retrieved collaborators for ${owner}/${repo}: ${JSON.stringify(edges, null, 2)}`);

  return edges;
}
