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

/* eslint-disable no-console */

import { describe, expect, test } from 'vitest';

import {
  parseSearchQuery,
  parseToElasticsearch,
  toElasticsearch,
  toSearchQuery,
  SearchCompoundRange,
  SearchMatch,
  SearchMultiTerm,
  SearchPhrase,
  SearchRange,
  SearchTerm
} from '../src/search';

describe('search', () => {
  describe('parseSearchQuery', () => {
    test('single word', () => {
      const clauses: any[] = parseSearchQuery('avocado');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      expect(clauses[0].value).toBe('avocado');
    });
    test('mixed-case word', () => {
      const clauses: any[] = parseSearchQuery('Hipster');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      expect(clauses[0].value).toBe('Hipster');
    });
    test('untrimmed word', () => {
      const clauses: any[] = parseSearchQuery(' avocado ');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      expect(clauses[0].value).toBe('avocado');
    });
    test('two words', () => {
      const clauses: any[] = parseSearchQuery('avocado toast');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      // expect(clauses[1]).toBeInstanceOf(SearchMatch);
      expect(clauses[0].value).toBe('avocado toast');
      // expect(clauses[1].value).toBe('toast');
    });
    test('number as word', () => {
      const clauses: any[] = parseSearchQuery('42');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      expect(clauses[0].value).toBe('42');
    });
    test('symbols in words', () => {
      const clauses: any[] = parseSearchQuery("1st Bank's $50");
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      expect(clauses[0].value).toBe("1st Bank's $50");
      // expect(clauses[1]).toBeInstanceOf(SearchMatch);
      // expect(clauses[1].value).toBe("Bank's");
      // expect(clauses[2]).toBeInstanceOf(SearchMatch);
      // expect(clauses[2].value).toBe('$50');
    });
    test('single term', () => {
      const clauses: any[] = parseSearchQuery('tag:hotels');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].key).toBe('tag');
      expect(clauses[0].value).toBe('hotels');
    });
    test('two term', () => {
      const clauses: any[] = parseSearchQuery('tag:hotels user:msmith');
      expect(clauses).toHaveLength(2);
      expect(clauses[0]).toBeInstanceOf(SearchTerm);
      expect(clauses[1]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].key).toBe('tag');
      expect(clauses[0].value).toBe('hotels');
      expect(clauses[1].key).toBe('user');
      expect(clauses[1].value).toBe('msmith');
    });
    test('quoted term', () => {
      const clauses: any[] = parseSearchQuery('team:"Mergers & Acquisitions"');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].key).toBe('team');
      expect(clauses[0].value).toBe('Mergers & Acquisitions');
    });
    test('uncompleted term', () => {
      const clauses: any[] = parseSearchQuery('tag:');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].key).toBe('tag');
      expect(clauses[0].value).toBe('');
    });
    test('word and term', () => {
      const clauses: any[] = parseSearchQuery('insights user:msmith');
      expect(clauses).toHaveLength(2);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      expect(clauses[1]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].value).toBe('insights');
      expect(clauses[1].key).toBe('user');
      expect(clauses[1].value).toBe('msmith');
    });
    test('terms', () => {
      const clauses: any[] = parseSearchQuery('tag:{hotel,flight}');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMultiTerm);
      expect(clauses[0].key).toBe('tag');
      expect(clauses[0].values).toEqual(['hotel', 'flight']);
    });
    test('quoted terms', () => {
      const clauses: any[] = parseSearchQuery('tag:{"cellar door","auspicious bird"}');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMultiTerm);
      expect(clauses[0].key).toBe('tag');
      expect(clauses[0].values).toEqual(['cellar door', 'auspicious bird']);
    });
    test('whitespace terms', () => {
      const clauses: any[] = parseSearchQuery('tag:{hotel, flight}');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMultiTerm);
      expect(clauses[0].key).toBe('tag');
      expect(clauses[0].values).toEqual(['hotel', 'flight']);
    });
    test('extra whitespace terms', () => {
      const clauses: any[] = parseSearchQuery('tag:{ hotel , flight , cars }');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchMultiTerm);
      expect(clauses[0].key).toBe('tag');
      expect(clauses[0].values).toEqual(['hotel', 'flight', 'cars']);
    });
    test('double-quoted phrase', () => {
      const clauses: any[] = parseSearchQuery('"powered by analysts"');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchPhrase);
      expect(clauses[0].value).toBe('powered by analysts');
    });
    test('single-quoted phrase', () => {
      const clauses: any[] = parseSearchQuery("'powered by analysts'");
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchPhrase);
      expect(clauses[0].value).toBe('powered by analysts');
    });
    test('two phrases', () => {
      const clauses: any[] = parseSearchQuery('"powered by analysts" "made with love"');
      expect(clauses).toHaveLength(2);
      expect(clauses[0]).toBeInstanceOf(SearchPhrase);
      expect(clauses[0].value).toBe('powered by analysts');
      expect(clauses[1]).toBeInstanceOf(SearchPhrase);
      expect(clauses[1].value).toBe('made with love');
    });
    test('word phrase term', () => {
      const clauses: any[] = parseSearchQuery('tag:cars "booking growth" infographics');
      expect(clauses).toHaveLength(3);
      expect(clauses[0]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].key).toBe('tag');
      expect(clauses[0].value).toBe('cars');
      expect(clauses[1]).toBeInstanceOf(SearchPhrase);
      expect(clauses[1].value).toBe('booking growth');
      expect(clauses[2]).toBeInstanceOf(SearchMatch);
      expect(clauses[2].value).toBe('infographics');
    });
    test('one unclosed phrase', () => {
      const clauses: any[] = parseSearchQuery('"powered by analysts');
      expect(clauses).toHaveLength(3);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      expect(clauses[0].value).toBe('"powered');
      expect(clauses[1]).toBeInstanceOf(SearchMatch);
      expect(clauses[1].value).toBe('by');
      expect(clauses[2]).toBeInstanceOf(SearchMatch);
      expect(clauses[2].value).toBe('analysts');
    });
    test('one unclosed phrase (trailing)', () => {
      const clauses: any[] = parseSearchQuery('powered by analysts"');
      expect(clauses).toHaveLength(3);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      expect(clauses[0].value).toBe('powered');
      expect(clauses[1]).toBeInstanceOf(SearchMatch);
      expect(clauses[1].value).toBe('by');
      expect(clauses[2]).toBeInstanceOf(SearchMatch);
      expect(clauses[2].value).toBe('analysts"');
    });
    test('mixed unclosed phrase', () => {
      const clauses: any[] = parseSearchQuery('powered by "analysts');
      expect(clauses).toHaveLength(3);
      expect(clauses[0]).toBeInstanceOf(SearchMatch);
      expect(clauses[0].value).toBe('powered');
      expect(clauses[1]).toBeInstanceOf(SearchMatch);
      expect(clauses[1].value).toBe('by');
      expect(clauses[2]).toBeInstanceOf(SearchMatch);
      expect(clauses[2].value).toBe('"analysts');
    });
    test('empty phrase', () => {
      const clauses: any[] = parseSearchQuery('""');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchPhrase);
      expect(clauses[0].value).toBe('');
    });
    test('adjoined unclosed phrase', () => {
      const clauses: any[] = parseSearchQuery('"test search""');
      expect(clauses).toHaveLength(2);
      expect(clauses[0]).toBeInstanceOf(SearchPhrase);
      expect(clauses[0].value).toBe('test search');
    });
    test('@author', () => {
      const clauses: any[] = parseSearchQuery('@username');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].key).toBe('author');
      expect(clauses[0].value).toBe('username');
    });
    test('#tag', () => {
      const clauses: any[] = parseSearchQuery('#myTag');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].key).toBe('tag');
      expect(clauses[0].value).toBe('myTag');
    });
    test('range', () => {
      const clauses: any[] = parseSearchQuery('updatedDate:>2020-03-01');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchRange);
      expect(clauses[0].key).toBe('updatedDate');
      expect(clauses[0].operation).toBe('>');
      expect(clauses[0].value).toBe('2020-03-01');
    });
    test('two date ranges', () => {
      const clauses: any[] = parseSearchQuery('updatedDate:>=2020-03-01 updatedDate:<=2020-10-01');
      expect(clauses).toHaveLength(2);
      expect(clauses[0]).toBeInstanceOf(SearchRange);
      expect(clauses[0].key).toBe('updatedDate');
      expect(clauses[0].operation).toBe('>=');
      expect(clauses[0].value).toBe('2020-03-01');
      expect(clauses[1]).toBeInstanceOf(SearchRange);
      expect(clauses[1].key).toBe('updatedDate');
      expect(clauses[1].operation).toBe('<=');
      expect(clauses[1].value).toBe('2020-10-01');
    });
    test('two other ranges', () => {
      const clauses: any[] = parseSearchQuery('publishedDate:<now-2d publishedDate:>2020-10-01');
      expect(clauses).toHaveLength(2);
      expect(clauses[0]).toBeInstanceOf(SearchRange);
      expect(clauses[0].key).toBe('publishedDate');
      expect(clauses[0].operation).toBe('<');
      expect(clauses[0].value).toBe('now-2d');
      expect(clauses[1]).toBeInstanceOf(SearchRange);
      expect(clauses[1].key).toBe('publishedDate');
      expect(clauses[1].operation).toBe('>');
      expect(clauses[1].value).toBe('2020-10-01');
    });
    test('compound range', () => {
      const clauses: any[] = parseSearchQuery('updatedDate:[2020-03-01 to 2020-10-01]');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchCompoundRange);
      expect(clauses[0].key).toBe('updatedDate');
      expect(clauses[0].from).toBe('2020-03-01');
      expect(clauses[0].to).toBe('2020-10-01');
    });
    test('compound range with relative dates', () => {
      const clauses: any[] = parseSearchQuery('updatedDate:[now-1d/d to now]');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchCompoundRange);
      expect(clauses[0].key).toBe('updatedDate');
      expect(clauses[0].from).toBe('now-1d/d');
      expect(clauses[0].to).toBe('now');
    });
    test('incomplete compound range', () => {
      const clauses: any[] = parseSearchQuery('updatedDate:[2020-03-01]');
      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].key).toBe('updatedDate');
      expect(clauses[0].value).toBe('[2020-03-01]');
    });
    test('unclosed compound range', () => {
      const clauses: any[] = parseSearchQuery('updatedDate:[2020-03-01 to 2020-10-01');
      expect(clauses).toHaveLength(3);
      expect(clauses[0]).toBeInstanceOf(SearchTerm);
      expect(clauses[0].key).toBe('updatedDate');
      expect(clauses[0].value).toBe('[2020-03-01');
      expect(clauses[1]).toBeInstanceOf(SearchMatch);
      expect(clauses[1].value).toBe('to');
      expect(clauses[2]).toBeInstanceOf(SearchMatch);
      expect(clauses[2].value).toBe('2020-10-01');
    });
  });
  describe('toElasticsearch', () => {
    test('word', () => {
      const clauses: any[] = parseSearchQuery('avocado');
      const es = toElasticsearch(clauses);
      expect(es).toMatchObject({
        bool: {
          minimum_should_match: 1,
          should: [{ multi_match: { query: 'avocado' } }]
        }
      });
    });
    test('two words', () => {
      const clauses: any[] = parseSearchQuery('avocado toast');
      const es = toElasticsearch(clauses);
      expect(es).toMatchObject({
        bool: {
          minimum_should_match: 1,
          should: [{ multi_match: { query: 'avocado' } }, { multi_match: { query: 'toast' } }]
        }
      });
    });
    test('word and tag', () => {
      const clauses: any[] = parseSearchQuery('tag:demo insight');
      const es = toElasticsearch(clauses);
      expect(es).toMatchObject({
        bool: {
          minimum_should_match: 1,
          filter: [{ term: { 'tags.keyword': { value: 'demo' } } }],
          should: [{ multi_match: { query: 'insight' } }]
        }
      });
    });
    test('terms', () => {
      const clauses: any[] = parseSearchQuery('itemType:{insight,page}');
      const es = toElasticsearch(clauses);
      expect(es).toMatchObject({
        bool: {
          filter: [{ terms: { itemType: ['insight', 'page'] } }]
        }
      });
    });
    test('word, phrase, tag, author', () => {
      const clauses: any[] = parseSearchQuery('"best practice" #demo insight @username');
      const es = toElasticsearch(clauses);
      expect(es).toMatchObject({
        bool: {
          filter: [
            { term: { 'tags.keyword': { value: 'demo' } } },
            {
              bool: {
                should: [
                  { term: { 'contributors.userName.keyword': { value: 'username' } } },
                  { term: { 'contributors.displayName.keyword': { value: 'username' } } }
                ]
              }
            }
          ],
          should: [
            {
              multi_match: {
                query: 'best practice',
                type: 'phrase'
              }
            },
            { multi_match: { query: 'insight' } }
          ]
        }
      });
    });
    test('two date ranges', () => {
      const clauses: any[] = parseSearchQuery('updatedDate:>=2020-03-01 updatedDate:<=2020-10-01');
      const es = toElasticsearch(clauses);
      expect(es).toMatchObject({
        bool: {
          filter: [
            {
              range: {
                updatedAt: {
                  gte: '2020-03-01'
                }
              }
            },
            {
              range: {
                updatedAt: {
                  lte: '2020-10-01'
                }
              }
            }
          ]
        }
      });
    });
  });
  describe('parseToElasticsearch', () => {
    test('tag term', () => {
      const es = parseToElasticsearch('tag:demo');
      expect(es).toMatchObject({
        bool: {
          filter: [{ term: { 'tags.keyword': { value: 'demo' } } }]
        }
      });
    });
    test('author term', () => {
      const es = parseToElasticsearch('author:username');
      expect(es).toMatchObject({
        bool: {
          filter: [
            {
              bool: {
                should: [
                  { term: { 'contributors.userName.keyword': { value: 'username' } } },
                  { term: { 'contributors.displayName.keyword': { value: 'username' } } }
                ]
              }
            }
          ]
        }
      });
    });
    test('word, phrase, term', () => {
      const es = parseToElasticsearch('"best practice" tag:demo insight');
      expect(es).toMatchObject({
        bool: {
          minimum_should_match: 1,
          filter: [{ term: { 'tags.keyword': { value: 'demo' } } }],
          should: [
            {
              multi_match: {
                query: 'best practice',
                type: 'phrase'
              }
            },
            { multi_match: { query: 'insight' } }
          ]
        }
      });
    });
    test('itemType terms', () => {
      const es = parseToElasticsearch('itemType:{template, page}');
      expect(es).toMatchObject({
        bool: {
          filter: [{ terms: { itemType: ['template', 'page'] } }]
        }
      });
    });
  });
  describe('toSearchQuery', () => {
    test('word', () => {
      const clauses: any[] = parseSearchQuery('avocado');
      const query = toSearchQuery(clauses);
      expect(query).toBe('avocado');
    });
    test('two words', () => {
      const clauses: any[] = parseSearchQuery('avocado toast');
      const query = toSearchQuery(clauses);
      expect(query).toBe('avocado toast');
    });
    test('word and tag', () => {
      const clauses: any[] = parseSearchQuery('tag:demo insight');
      const query = toSearchQuery(clauses);
      expect(query).toBe('#demo insight');
    });
    test('word, phrase, tag, author', () => {
      const clauses: any[] = parseSearchQuery('"best practice" #demo insight @username');
      const query = toSearchQuery(clauses);
      expect(query).toBe('"best practice" #demo insight @username');
    });
    test('two date ranges', () => {
      const clauses: any[] = parseSearchQuery('updatedDate:>=2020-03-01 updatedDate:<=2020-10-01');
      const query = toSearchQuery(clauses);
      expect(query).toBe('updatedDate:>=2020-03-01 updatedDate:<=2020-10-01');
    });
    test('author full name', () => {
      const clauses: any[] = parseSearchQuery('author:"John Doe"');
      const query = toSearchQuery(clauses);
      expect(query).toBe('author:"John Doe"');
    });
  });
});
