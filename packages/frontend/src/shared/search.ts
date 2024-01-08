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

import Parsimmon, { optWhitespace } from 'parsimmon';

// NOTE: this file is copied from `backend` due to import limitations
// with Create-React-App.  Do not change this file independently!
//
// TODO: Move into a shared dependency

/**
 * Translates from user-facing search keys to Elasticsearch fields.
 *
 * @param key User-provided key.
 */
function convertField(key: string): string {
  switch (key) {
    case 'tag': {
      return 'tags.keyword';
    }
    case 'author': {
      return 'contributors.userName.keyword';
    }
    case 'user': {
      return 'user.userName.keyword';
    }
    case 'targetUser': {
      return 'details.userName.keyword';
    }
    case 'team': {
      return 'metadata.team.keyword';
    }
    case 'createdDate': {
      return 'createdAt';
    }
    case 'updatedDate': {
      return 'updatedAt';
    }
    case 'publishedDate': {
      return 'metadata.publishedDate';
    }
    case 'itemType': {
      return 'itemType';
    }
    case 'insight': {
      return 'details.insightName.keyword';
    }
    default: {
      return key;
    }
  }
}

/**
 * Translates from user-facing operations to Elasticsearch operations.
 *
 * @param operation User-provided operation.
 */
function convertOperation(operation: string): string {
  switch (operation) {
    case '>': {
      return 'gt';
    }
    case '>=': {
      return 'gte';
    }
    case '<': {
      return 'lt';
    }
    case '<=': {
      return 'lte';
    }
    default: {
      return operation;
    }
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
    return {
      bool: {
        should: [
          {
            multi_match: {
              query: this.value,
              fields: '*',
              type: 'most_fields',
              fuzziness: 'AUTO'
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
      case 'author': {
        return `@${this.value}`;
      }
      case 'tag': {
        return `#${this.value}`;
      }
      default: {
        return this.value.includes(' ') ? `${this.key}:"${this.value}"` : `${this.key}:${this.value}`;
      }
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

//
// Parsimmon language
//
const lang = Parsimmon.createLanguage({
  Word: () => {
    return Parsimmon.regexp(/[^\s:]+/i);
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
    return r.Word.map((value) => new SearchMatch(value));
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
  const clauses: SearchClause[] = lang.Query.tryParse(searchQuery);

  return clauses;
}

export function toSearchQuery(clauses: SearchClause[]): string {
  const stringFragments = clauses.map((clause) => clause.toString());

  return stringFragments.join(' ');
}
