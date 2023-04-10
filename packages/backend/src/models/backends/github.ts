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

export enum GitHubRepositoryOwnerType {
  ORGANIZATON = 'Organization',
  USER = 'User'
}

// https://docs.github.com/en/graphql/reference/input-objects#updaterepositoryinput
export interface UpdateRepositoryInput {
  repositoryId: string;
  description?: string;
  homepageUrl?: string;
}

// https://docs.github.com/en/graphql/reference/input-objects#updatetopicsinput
export interface UpdateTopicsInput {
  repositoryId: string;
  topicNames?: string[];
}

export enum RepositoryVisibility {
  INTERNAL = 'INTERNAL',
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC'
}

// https://docs.github.com/en/graphql/reference/input-objects#createrepositoryinput
export interface CreateRepositoryInput {
  description?: string;
  name: string;
  ownerId: string;
  teamId?: string;
  template?: boolean;
  visibility?: RepositoryVisibility;
}

// https://docs.github.com/en/graphql/reference/input-objects#clonetemplaterepositoryinput
export interface CloneTemplateRepositoryInput {
  description?: string;
  includeAllBranches?: boolean;
  name: string;
  ownerId: string;
  repositoryId: string;
  visibility?: RepositoryVisibility;
}

// https://docs.github.com/en/graphql/reference/interfaces#repositoryowner
export interface RepositoryOwner {
  __typename?: GitHubRepositoryOwnerType;
  id: string;
  login: string;
  avatarUrl?: string;
  repositories?: any[];
  url?: string;
}

export interface GitHubRepositoryStub {
  id: string;
  name: string;
  nameWithOwner: string;
  url: string;
  cloneUrl: string;
}

export type GitHubRepositoryExists = Pick<GitHubRepositoryStub, 'id' | 'nameWithOwner'> & {
  isArchived: boolean;
};

export interface GitHubRepository extends GitHubRepositoryStub {
  owner: RepositoryOwner;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  forkCount?: number;
  stargazers?: { totalCount: number };
  repositoryTopics?: { edges: { node: any }[] };
  defaultBranchRef?: { name: string; target?: any };
  isArchived: boolean;
  collaborators: {
    pageInfo?: {
      hasNextPage: boolean;
      endCursor: string;
    };
    edges: GitHubRepositoryCollaboratorEdge[];
  };
}

export type GitHubRepositoryCollaboratorEdge = { permission: GitHubRepositoryPermission; node: GitHubUser };

export type GitHubRepositoryHistoryEdge = { node: GitHubCommit };

export type GitHubRepositoryPermission = 'ADMIN' | 'MAINTAIN' | 'READ' | 'TRIAGE' | 'WRITE' | 'NONE';

export type GitHubCollaboratorAffiliation = 'OUTSIDE' | 'DIRECT' | 'ALL';

export interface GitHubOrganization {
  id: string;
  name: string;
}

export interface GitHubUser {
  id: string;
  databaseId: number;
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
  url: string;
  bio: string;
  location: string;
  status: {
    message: string;
    emoji: string;
  };
  defaultOrg: null | Partial<GitHubOrganization>;
}

export interface GitHubTokenMetadata {
  login: string;
  scopes: string[];
}

export interface GitHubCommit {
  message: string;
  committedDate: string;
  author: {
    name: string;
    user: GitHubUser;
  };
  changedFiles: number;
  additions: number;
  deletions: number;
  abbreviatedOid: string;
  oid: string;
}
