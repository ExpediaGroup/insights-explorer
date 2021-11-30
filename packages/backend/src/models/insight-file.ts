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

import { IndexedInsightFileConversion, IndexedInsightFile } from '@iex/models/indexed/indexed-insight-file';
import { InsightFileAction } from '@iex/models/insight-file-action';
import { Field, ObjectType, InputType } from 'type-graphql';

@ObjectType()
export class InsightFileConversion implements IndexedInsightFileConversion {
  @Field()
  mimeType!: string;

  @Field()
  path!: string;
}

@ObjectType()
export class InsightFile implements IndexedInsightFile {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  path!: string;

  @Field()
  mimeType!: string;

  @Field()
  size!: number;

  @Field({ nullable: true })
  encoding?: string;

  @Field({ nullable: true })
  contents?: string;

  @Field({ nullable: true })
  hash?: string;

  @Field({ nullable: true })
  readonly?: boolean;

  @Field(() => [InsightFileConversion], { nullable: true })
  conversions?: InsightFileConversion[];
}

@InputType()
export class InsightFileInput {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  path!: string;

  @Field({ nullable: true })
  mimeType?: string;

  @Field({ nullable: true })
  contents?: string;

  @Field()
  action!: InsightFileAction;

  @Field({ nullable: true })
  originalPath?: string;
}

@InputType()
export class InsightFileUploadInput implements Partial<InsightFile> {
  @Field()
  id!: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  path?: string;

  @Field()
  size!: number;
}
