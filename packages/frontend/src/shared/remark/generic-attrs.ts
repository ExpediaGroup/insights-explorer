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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Attribute {}

export class KeyAttribute implements Attribute {
  constructor(public key: string) {}
}

export class KeyValueAttribute implements Attribute {
  constructor(
    public key: string,
    public value: string
  ) {}
}

const lang = Parsimmon.createLanguage({
  Word: () => {
    return Parsimmon.regexp(/[^\s=]+/i);
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
  Key: (r) => {
    return r.Word.map((key) => new KeyAttribute(key.toLowerCase()));
  },
  KeyValueSeparator: () => {
    return Parsimmon.string('=');
  },
  KeyValue: (r) => {
    return Parsimmon.seq(r.Word, r.KeyValueSeparator.then(Parsimmon.alt(r.String, r.Word).fallback(''))).map(
      ([key, value]) => {
        return new KeyValueAttribute(key.toLowerCase(), value);
      }
    );
  },
  Token: (r) => {
    return Parsimmon.alt(r.KeyValue, r.Key);
  },
  Attributes: (r) => {
    return r.Token.sepBy(optWhitespace).trim(optWhitespace);
  }
});

/**
 * Parse generic markdown attributes (limited)
 *
 * https://talk.commonmark.org/t/consistent-attribute-syntax/272
 *
 * @param attributeText Attribute text
 */
export function parseAttributes(attributeText: string): Attribute[] {
  const attributes: Attribute[] = lang.Attributes.tryParse(attributeText);

  return attributes;
}
