/* eslint-disable unicorn/switch-case-braces */
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

import type { SearchQuery } from '@iex/models/elasticsearch';
import { isObject } from 'lodash';
import isArray from 'lodash/isArray';
import mergeWith from 'lodash/mergeWith';
import Parsimmon, { optWhitespace } from 'parsimmon';

import { getLogger } from './logger';

const logger = getLogger('search');
/**
 * Translates from user-facing search keys to Elasticsearch fields.
 *
 * @param key User-provided key.
 */
function convertField(key: string): string {
  switch (key) {
    case 'tag':
      return 'tags.keyword';
    case 'author':
      return 'contributors.userName.keyword';
    case 'user':
      return 'user.userName.keyword';
    case 'targetUser':
      return 'details.userName.keyword';
    case 'team':
      return 'metadata.team.keyword';
    case 'createdDate':
      return 'createdAt';
    case 'updatedDate':
      return 'updatedAt';
    case 'publishedDate':
      return 'metadata.publishedDate';
    case 'itemType':
      return 'itemType';
    case 'insight':
      return 'details.insightName.keyword';
    default:
      return key;
  }
}

/**
 * Translates from user-facing operations to Elasticsearch operations.
 *
 * @param operation User-provided operation.
 */
function convertOperation(operation: string): string {
  switch (operation) {
    case '>':
      return 'gt';
    case '>=':
      return 'gte';
    case '<':
      return 'lt';
    case '<=':
      return 'lte';
    default:
      return operation;
  }
}

export interface SearchClause {
  toElasticsearch(): any;
  toString(): string;
}

export class SearchMatch implements SearchClause {
  public value: string;

  constructor(value: string) {
    this.value = value;
  }

  toElasticsearch(): any {
    logger.debug(`Match option in NEW SEARCH`);
    return {
      bool: {
        minimum_should_match: 1,
        should: [
          {
            multi_match: {
              query: this.value,
              fields: [
                'description',
                'name^3',
                'fullName', // (index with simple analyzer?)
                'tags',
                'readme.contents', // (index with english analyzer?)
                '_collaborators.user.userName',
                '_collaborators.user.displayName',
                'contributors.userName',
                'contributors.displayName'
              ],
              type: 'best_fields',
              fuzziness: 'AUTO',
              analyzer: 'simple'
            }
          },
          {
            multi_match: {
              query: this.value,
              fields: [
                'description',
                'name^3',
                'fullName', // (index with simple analyzer?)
                'tags',
                'readme.contents', // (index with english analyzer?)
                '_collaborators.user.userName',
                '_collaborators.user.displayName',
                'contributors.userName',
                'contributors.displayName'
              ],
              type: 'phrase_prefix',
              analyzer: 'standard'
            }
          }
        ]
      }
    };
  }

  toString(): string {
    return this.value;
  }
}

export class SearchPhrase implements SearchClause {
  public value: string;

  constructor(value: string) {
    this.value = value;
  }

  toElasticsearch(): any {
    return {
      bool: {
        minimum_should_match: 1,
        should: [
          {
            multi_match: {
              query: this.value,
              fields: '*',
              type: 'phrase'
            }
          }
        ]
      }
    };
  }

  toString(): string {
    return '"' + this.value + '"';
  }
}

export class SearchTerm implements SearchClause {
  public key: string;
  public value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }

  toElasticsearch(): any {
    if (this.value === '*') {
      // Wildcard query, just ignore the entire term
      return {};
    }

    if (this.key === 'author') {
      // Special case for supporting either username or display name
      return {
        bool: {
          filter: [
            {
              bool: {
                should: [
                  {
                    term: {
                      'contributors.userName.keyword': {
                        value: this.value
                      }
                    }
                  },
                  {
                    term: {
                      'contributors.displayName.keyword': {
                        value: this.value
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      };
    }

    return {
      bool: {
        filter: [
          {
            term: {
              [convertField(this.key)]: {
                value: this.value
              }
            }
          }
        ]
      }
    };
  }

  toString(): string {
    switch (this.key) {
      case 'author':
        return this.value.includes(' ') ? `author:"${this.value}"` : `@${this.value}`;
      case 'tag':
        return `#${this.value}`;
      default:
        return this.value.includes(' ') ? `${this.key}:"${this.value}"` : `${this.key}:${this.value}`;
    }
  }
}

export class SearchMultiTerm implements SearchClause {
  public key: string;
  public values: string[];

  constructor(key: string, values: string[]) {
    this.key = key;
    this.values = values;
  }

  toElasticsearch(): any {
    return {
      bool: {
        filter: [
          {
            terms: {
              [convertField(this.key)]: this.values
            }
          }
        ]
      }
    };
  }

  toString(): string {
    return `${this.key}:{${this.values.map((v) => (v.includes(' ') ? `"${v}"` : v)).join(',')}}`;
  }
}

export class SearchRange implements SearchClause {
  public key: string;
  public operation: string;
  public value: string;

  constructor(key: string, operation: string, value: string) {
    this.key = key;
    this.operation = operation;
    this.value = value;
  }

  toElasticsearch(): any {
    return {
      bool: {
        filter: [
          {
            range: {
              [convertField(this.key)]: {
                [convertOperation(this.operation)]: this.value
              }
            }
          }
        ]
      }
    };
  }

  toString(): string {
    return `${this.key}:${this.operation}${this.value}`;
  }
}

export class SearchCompoundRange implements SearchClause {
  public key: string;
  public from: string;
  public to: string;

  constructor(key: string, from: string, to: string) {
    this.key = key;
    this.from = from;
    this.to = to;
  }

  toElasticsearch(): any {
    return {
      bool: {
        filter: [
          {
            range: {
              [convertField(this.key)]: {
                gte: this.from,
                lte: this.to
              }
            }
          }
        ]
      }
    };
  }

  toString(): string {
    return `${this.key}:[${this.from} to ${this.to}]`;
  }
}

export class SearchNestedOrFilter implements SearchClause {
  constructor(protected clauses: any[]) {}

  toElasticsearch() {
    return {
      bool: {
        filter: [
          {
            bool: {
              should: this.clauses
            }
          }
        ]
      }
    };
  }

  toString(): string {
    throw new Error('Method not implemented.');
  }
}

//
// Parsimmon language
//
const lang = Parsimmon.createLanguage({
  Word: () => {
    // TODO: if(legacySearch) { old version } else { new version }
    // old Word is just Parsimmon.regexp(/[^\s:]+/i)
    return Parsimmon.regexp(/[^\s:]+/i);
    // new version combines multiple words found next to each other into one word
    // return Parsimmon.alt(
    //   Parsimmon.seq(
    //     Parsimmon.regexp(/[^\s:]+/i),
    //     Parsimmon.optWhitespace,
    //     Parsimmon.regexp(/[^\s:]+/i),
    //     Parsimmon.optWhitespace,
    //     Parsimmon.regexp(/[^\s:]+/i)
    //   ).map(([first, , second, , third]) => first + ' ' + second + ' ' + third),
    //   Parsimmon.seq(Parsimmon.regexp(/[^\s:]+/i), Parsimmon.optWhitespace, Parsimmon.regexp(/[^\s:]+/i)).map(
    //     ([first, , second]) => first + ' ' + second
    //   ),
    //   Parsimmon.regexp(/[^\s:]+/i)
    // );
  },
  Words: (r) => {
    return (
      r.Word
        // Skip words immediately followed by a filter separator
        // These are a type of Term
        .notFollowedBy(r.FilterSeparator)
        // Combine multiple words into one, separated by whitespace
        // Must have at least one word
        .sepBy1(
          Parsimmon.whitespace.notFollowedBy(
            // Stop combining words if we see any of these terms
            // It will be parsed as a separate Token
            Parsimmon.alt(r.String, r.AuthorTerm, r.TagTerm)
          )
        )
        .map((words) => words.join(' '))
    );
  },
  CompoundRangeWord: () => {
    return Parsimmon.regexp(/[^\s:[\]]+/i).fallback('');
  },
  MultiTermWord: () => {
    return Parsimmon.regexp(/[^\s,:{}]+/i).fallback('');
  },
  String: () => {
    // One of possible quotes, then sequence of anything
    // except that quote (unless escaped), then the same quote
    return Parsimmon.oneOf(`"'`).chain(function (q) {
      return Parsimmon.alt(
        Parsimmon.noneOf(`\\${q}`).atLeast(1).tie(), // everything but quote and escape sign
        Parsimmon.string(`\\`).then(Parsimmon.any) // escape sequence like \"
      )
        .many()
        .tie()
        .skip(Parsimmon.string(q));
    });
  },
  Match: (r) => {
    return r.Words.map((value) => new SearchMatch(value));
  },
  Phrase: (r) => {
    return r.String.map((s) => new SearchPhrase(s));
  },
  FilterSeparator: () => {
    return Parsimmon.string(':');
  },
  AuthorTerm: (r) => {
    return Parsimmon.string('@')
      .then(r.Word.fallback(''))
      .map((author) => {
        return new SearchTerm('author', author);
      });
  },
  TagTerm: (r) => {
    return Parsimmon.string('#')
      .then(r.Word.fallback(''))
      .map((tag) => {
        return new SearchTerm('tag', tag);
      });
  },
  GenericTerm: (r) => {
    return Parsimmon.seq(r.Word, r.FilterSeparator.then(Parsimmon.alt(r.String, r.Word.fallback('')))).map(
      ([key, value]) => {
        return new SearchTerm(key, value);
      }
    );
  },
  Term: (r) => {
    return Parsimmon.alt(r.AuthorTerm, r.TagTerm, r.GenericTerm);
  },
  MultiTerm: (r) => {
    return Parsimmon.seq(
      r.Word,
      r.FilterSeparator.then(
        Parsimmon.lookahead(/{(.*)}/).then(
          Parsimmon.alt(r.String, r.MultiTermWord.fallback(''))
            .trim(optWhitespace)
            .sepBy(Parsimmon.string(',').trim(optWhitespace))
            .wrap(Parsimmon.string('{'), Parsimmon.string('}'))
        )
      )
    ).map(([key, values]) => {
      return new SearchMultiTerm(key, values);
    });
  },
  RangeOperation: () => {
    return Parsimmon.alt(Parsimmon.string('>='), Parsimmon.string('>'), Parsimmon.string('<='), Parsimmon.string('<'));
  },
  Range: (r) => {
    return Parsimmon.seq(r.Word, r.FilterSeparator.then(Parsimmon.seq(r.RangeOperation, r.Word.fallback('')))).map(
      ([key, [operation, value]]) => {
        return new SearchRange(key, operation, value);
      }
    );
  },
  CompoundRange: (r) => {
    return Parsimmon.seq(
      r.Word,
      r.FilterSeparator.then(
        Parsimmon.lookahead(/\[(.*)]/).then(
          Parsimmon.seq(r.CompoundRangeWord, Parsimmon.string('to').trim(optWhitespace).then(r.CompoundRangeWord)).wrap(
            Parsimmon.string('['),
            Parsimmon.string(']')
          )
        )
      )
    ).map(([key, [from, to]]) => {
      return new SearchCompoundRange(key, from, to);
    });
  },
  Token: (r) => {
    return Parsimmon.alt(r.Phrase, r.CompoundRange, r.Range, r.MultiTerm, r.Term, r.Match);
  },
  Query: (r) => {
    // Query is a sequence of tokens separated by whitespace
    return r.Token.sepBy(optWhitespace).trim(optWhitespace);
  }
});

/**
 * Parse a search query into a series of SearchClause objects.
 *
 * @param searchQuery Query text
 */
export function parseSearchQuery(searchQuery: string): SearchClause[] {
  logger.debug('Parsing search query ' + searchQuery);
  const clauses: SearchClause[] = lang.Query.tryParse(searchQuery);
  logger.debug(`tryParse values would be ${lang.Query.tryParse(searchQuery)}`);

  logger.debug('Parsed clauses ' + JSON.stringify(clauses));
  return clauses;
}

const mergeCustomizer = (objectValue: any, sourceValue: any): any => {
  // Concat arrays together
  if (isArray(objectValue)) {
    return [...objectValue, ...sourceValue];
  }
  if (isObject(objectValue)) {
    return mergeWith(objectValue, sourceValue, mergeCustomizer);
  }
};

export function toElasticsearch(clauses: SearchClause[]): SearchQuery {
  const esFragments = clauses.map((clause) => clause.toElasticsearch());

  // Reduce all fragments into a combined Elasticsearch query
  const query = esFragments.reduce<any>((accumulator, fragment) => {
    return mergeWith(accumulator, fragment, mergeCustomizer);
  }, {});

  return query;
}

export function toSearchQuery(clauses: SearchClause[]): string {
  const stringFragments = clauses.map((clause) => clause.toString());

  return stringFragments.join(' ');
}

/**
 * Parse a search query into an Elasticsearch query.
 *
 * @param searchQuery Query text
 * @param modifier Optional function that can modify the parsed clauses before converting
 */
export function parseToElasticsearch(
  searchQuery: string,
  modifier?: (clauses: SearchClause[]) => SearchClause[]
): SearchQuery {
  logger.debug(`In parsetoElasticsearchNEW, the searchQuery is ${searchQuery}`);
  let clauses = parseSearchQuery(searchQuery);

  if (modifier) {
    // Allow the modifier to update things
    clauses = modifier([...clauses]);
  }

  logger.debug(`parseToElasticsearchNEW is going to return ${JSON.stringify(toElasticsearch(clauses), null, 2)}`);
  return toElasticsearch(clauses);
}
