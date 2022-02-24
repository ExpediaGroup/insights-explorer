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

import { Field, ObjectType } from 'type-graphql';

export type OAuthProvider = 'github' | 'okta';

@ObjectType()
export class AuthSettings {
  @Field()
  provider!: OAuthProvider;

  @Field()
  authorizeUrl!: string;

  @Field()
  clientId!: string;

  @Field()
  scopes!: string;

  @Field({ nullable: true })
  issuer?: string;

  @Field()
  pkceEnabled!: boolean;
}

@ObjectType()
export class GitHubSettings {
  @Field()
  url!: string;

  @Field()
  graphqlApiUrl!: string;

  @Field()
  restApiUrl!: string;

  @Field()
  defaultOrg!: string;
}

@ObjectType()
export class ChatSettings {
  @Field()
  provider!: string;

  @Field()
  channel!: string;

  @Field()
  url!: string;
}

@ObjectType()
export class AppSettings {
  @Field()
  version!: string;

  @Field()
  gitHubSettings!: GitHubSettings;

  @Field()
  authSettings!: AuthSettings;

  @Field()
  iexScmUrl!: string;

  @Field()
  externalDocUrl!: string;

  @Field({ nullable: true })
  externalVideosUrl?: string;

  @Field({ nullable: true })
  externalBlogUrl?: string;

  @Field({ nullable: true })
  chatSettings?: ChatSettings;
}
