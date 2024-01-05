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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, expect, test } from 'vitest';

import type { InsightFile, InsightFileAction, InsightFolder } from '../models/file-tree';

import { convertFilesIntoTree, InsightFileTree, isFile, isFolder } from './file-tree';

describe('file-tree', () => {
  const filesA = () => [
    {
      id: 'a',
      name: 'a.pdf',
      path: 'a.pdf'
    },
    {
      id: 'b',
      name: 'b.pdf',
      path: 'b.pdf'
    },
    {
      id: 'c',
      name: 'c.pdf',
      path: 'subfolder/c.pdf'
    }
  ];

  describe('isFolder/isFile', () => {
    test('detect a folder', () => {
      const item = {
        id: 'a',
        name: 'a',
        path: 'a',
        tree: []
      };

      expect(isFile(item)).toBeFalsy();
      expect(isFolder(item)).toBeTruthy();
    });
    test('detect a file', () => {
      const item = {
        id: 'a',
        name: 'a.pdf',
        path: 'a.pdf'
      };

      expect(isFile(item)).toBeTruthy();
      expect(isFolder(item)).toBeFalsy();
    });
  });

  describe('convertFilesIntoTree', () => {
    test('convert a few flat files', () => {
      const files = [
        {
          id: 'a',
          name: 'a.pdf',
          path: 'a.pdf'
        },
        {
          id: 'b',
          name: 'b.pdf',
          path: 'b.pdf'
        }
      ];

      const tree = convertFilesIntoTree(files);

      expect(tree).toMatchObject([
        { id: 'a', name: 'a.pdf', path: 'a.pdf' },
        { id: 'b', name: 'b.pdf', path: 'b.pdf' }
      ]);
    });
    test('convert a few flat files and one subfolder', () => {
      const tree = convertFilesIntoTree(filesA());

      expect(tree).toMatchObject([
        { id: 'a', name: 'a.pdf', path: 'a.pdf' },
        { id: 'b', name: 'b.pdf', path: 'b.pdf' },
        {
          name: 'subfolder',
          path: 'subfolder',
          tree: [
            {
              id: 'c',
              name: 'c.pdf',
              path: 'subfolder/c.pdf'
            }
          ]
        }
      ]);
    });
    test('convert files in separate subfolders', () => {
      const files = [
        {
          id: 'a',
          name: 'a.pdf',
          path: 'one/a.pdf'
        },
        {
          id: 'b',
          name: 'b.pdf',
          path: 'two/b.pdf'
        }
      ];

      const tree = convertFilesIntoTree(files);

      expect(tree).toMatchObject([
        {
          name: 'one',
          path: 'one',
          tree: [
            {
              id: 'a',
              name: 'a.pdf',
              path: 'one/a.pdf'
            }
          ]
        },
        {
          name: 'two',
          path: 'two',
          tree: [
            {
              id: 'b',
              name: 'b.pdf',
              path: 'two/b.pdf'
            }
          ]
        }
      ]);
    });
    test('convert multiple files in the multiple subfolders', () => {
      const files = [
        {
          id: 'a',
          name: 'a.pdf',
          path: 'one/a.pdf'
        },
        {
          id: 'b',
          name: 'b.pdf',
          path: 'two/b.pdf'
        },
        {
          id: 'a2',
          name: 'a2.pdf',
          path: 'one/a2.pdf'
        },
        {
          id: 'b2',
          name: 'b2.pdf',
          path: 'two/b2.pdf'
        }
      ];

      const tree = convertFilesIntoTree(files);

      expect(tree).toMatchObject([
        {
          name: 'one',
          path: 'one',
          tree: [
            {
              id: 'a',
              name: 'a.pdf',
              path: 'one/a.pdf'
            },
            {
              id: 'a2',
              name: 'a2.pdf',
              path: 'one/a2.pdf'
            }
          ]
        },
        {
          name: 'two',
          path: 'two',
          tree: [
            {
              id: 'b',
              name: 'b.pdf',
              path: 'two/b.pdf'
            },
            {
              id: 'b2',
              name: 'b2.pdf',
              path: 'two/b2.pdf'
            }
          ]
        }
      ]);
    });
    test('convert deeply nested subfolders', () => {
      const files = [
        {
          id: 'a',
          name: 'a.pdf',
          path: 'alpha/beta/gamma/a.pdf'
        },
        {
          id: 'b',
          name: 'b.pdf',
          path: 'one/two/three/four/b.pdf'
        }
      ];

      const tree = convertFilesIntoTree(files);

      expect(tree).toMatchObject([
        {
          name: 'alpha',
          path: 'alpha',
          tree: [
            {
              name: 'beta',
              path: 'alpha/beta',
              tree: [
                {
                  name: 'gamma',
                  path: 'alpha/beta/gamma',
                  tree: [
                    {
                      name: 'a.pdf',
                      path: 'alpha/beta/gamma/a.pdf'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'one',
          path: 'one',
          tree: [
            {
              name: 'two',
              path: 'one/two',
              tree: [
                {
                  name: 'three',
                  path: 'one/two/three',
                  tree: [
                    {
                      name: 'four',
                      path: 'one/two/three/four',
                      tree: [
                        {
                          name: 'b.pdf',
                          path: 'one/two/three/four/b.pdf'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]);
    });
  });

  describe('InsightFileTree', () => {
    describe('constructor', () => {
      test('construct itself', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        expect(tree.getFiles()).toMatchObject([
          { id: 'a', name: 'a.pdf', path: 'a.pdf' },
          { id: 'b', name: 'b.pdf', path: 'b.pdf' },
          {
            name: 'subfolder',
            path: 'subfolder',
            tree: [
              {
                id: 'c',
                name: 'c.pdf',
                path: 'subfolder/c.pdf'
              }
            ]
          }
        ]);
      });
    });
    describe('addItem', () => {
      test('add a file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const newItem = {
          id: 'z',
          name: 'z.pdf',
          path: 'z.pdf'
        };

        tree.addItem(newItem);

        expect(tree.getFiles().find((f) => f.id === 'z')).toEqual(newItem);
      });
      test('add a file in a subfolder', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const newItem = {
          id: 'z',
          name: 'z.pdf',
          path: 'y/z.pdf'
        };

        tree.addItem(newItem);

        expect((tree.getFiles().find((f) => f.path === 'y') as InsightFolder).tree.find((f) => f.id === 'z')).toEqual(
          newItem
        );
      });
      test('add a deeply nested file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const newItem = {
          id: 'z',
          name: 'z.pdf',
          path: 'one/two/z.pdf'
        };

        tree.addItem(newItem);

        const one = tree.getFileByPath('one');
        expect(one).not.toBeUndefined();
        expect(isFolder(one!)).toBeTruthy();
        const two = tree.getFileByPath('one/two');
        expect(two).not.toBeUndefined();
        expect(isFolder(two!)).toBeTruthy();

        const z = tree.getFileByPath('one/two/z.pdf');
        expect(z).not.toBeUndefined();
        expect(isFile(z!)).toBeTruthy();
      });
      test('add a nested tree', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        tree.addItem({
          id: 'one',
          name: 'one',
          path: 'one',
          tree: []
        });
        tree.addItem({
          id: 'two',
          name: 'two',
          path: 'one/two',
          tree: []
        });
        tree.addItem({
          id: 'z',
          name: 'z.pdf',
          path: 'one/two/z.pdf'
        });

        const one = tree.getFileByPath('one');
        expect(one).not.toBeUndefined();
        expect(isFolder(one!)).toBeTruthy();
        const two = tree.getFileByPath('one/two');
        expect(two).not.toBeUndefined();
        expect(isFolder(two!)).toBeTruthy();

        const z = tree.getFileByPath('one/two/z.pdf');
        expect(z).not.toBeUndefined();
        expect(isFile(z!)).toBeTruthy();
      });
      test('replace an existing file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const replacementItem = {
          id: 'a-2',
          name: 'a.pdf',
          path: 'a.pdf'
        };

        tree.addItem(replacementItem);

        expect(tree.getFiles()).toHaveLength(3);
        expect(tree.getFiles().find((f) => f.name === 'a.pdf')?.id).toBe('a-2');
      });
    });
    describe('updateItemById', () => {
      test('update a file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const updatedItem = {
          id: 'a',
          name: 'a-updated.pdf',
          path: 'a-updated.pdf',
          action: 'modify' as InsightFileAction
        };

        tree.updateItemById(updatedItem);

        expect(tree.getFileById('a')?.path).toEqual(updatedItem.path);
      });
      test('update a file in a subfolder', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const updatedItem = {
          id: 'c',
          name: 'c.pdf',
          path: 'subfolder/c.pdf',
          contents: 'abc',
          action: 'modify' as InsightFileAction
        };

        tree.updateItemById(updatedItem);

        expect(
          (
            (tree.getFiles().find((f) => f.path === 'subfolder') as InsightFolder).tree.find(
              (f) => f.id === 'c'
            ) as InsightFile
          ).contents
        ).toEqual(updatedItem.contents);
      });
      test('rename a file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        tree.updateItemById({ id: 'a', name: 'a-2.pdf' });

        expect(tree.getFileById('a')).toEqual({ id: 'a', name: 'a-2.pdf', originalPath: 'a.pdf', path: 'a-2.pdf' });
      });
      test('rename a nested file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        tree.updateItemById({ id: 'c', name: 'c-2.pdf' });

        expect(tree.getFileById('c')).toEqual({
          id: 'c',
          name: 'c-2.pdf',
          originalPath: 'subfolder/c.pdf',
          path: 'subfolder/c-2.pdf'
        });
      });
      test('rename a folder', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const subfolder = tree.getFileByPath('subfolder');

        expect(subfolder).not.toBeUndefined();
        tree.updateItemById({ id: subfolder!.id, name: 'subfolder2' });

        const renamedFolder = tree.getFileByPath('subfolder2');
        expect(renamedFolder?.name).toBe('subfolder2');
        expect(renamedFolder?.path).toBe('subfolder2');
        expect(tree.getFileById('c')?.path).toBe('subfolder2/c.pdf');
      });
    });
    describe('flatten', () => {
      test('flatten a tree', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const flat = tree.flatten();

        expect(flat.length).toBe(3);
        expect(flat).toEqual([
          { id: 'a', name: 'a.pdf', path: 'a.pdf', originalPath: 'a.pdf' },
          { id: 'b', name: 'b.pdf', path: 'b.pdf', originalPath: 'b.pdf' },
          { id: 'c', name: 'c.pdf', path: 'subfolder/c.pdf', originalPath: 'subfolder/c.pdf' }
        ]);
      });
      test('flatten a tree with updated paths', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const updatedItem = {
          id: tree.getFiles().find((f) => f.name === 'subfolder')?.id,
          name: 'subfolder2'
        } as InsightFolder;

        tree.updateItemById(updatedItem);
        const flat = tree.flatten();

        expect(flat.length).toBe(3);
        expect(flat).toEqual([
          { id: 'c', name: 'c.pdf', path: 'subfolder2/c.pdf', originalPath: 'subfolder/c.pdf' },
          { id: 'a', name: 'a.pdf', path: 'a.pdf', originalPath: 'a.pdf' },
          { id: 'b', name: 'b.pdf', path: 'b.pdf', originalPath: 'b.pdf' }
        ]);
      });
      test('flatten a tree without empty-name files', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const newItem = {
          id: 'z',
          name: '',
          path: ''
        };

        tree.addItem(newItem);
        const flat = tree.flatten();

        expect(flat.length).toBe(3);
        expect(flat).toEqual([
          { id: 'c', name: 'c.pdf', path: 'subfolder/c.pdf', originalPath: 'subfolder/c.pdf' },
          { id: 'a', name: 'a.pdf', path: 'a.pdf', originalPath: 'a.pdf' },
          { id: 'b', name: 'b.pdf', path: 'b.pdf', originalPath: 'b.pdf' }
        ]);
      });
    });
    describe('getFileByPath', () => {
      test('get a top-level file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const file = tree.getFileByPath('a.pdf');
        expect(file).not.toBeUndefined();
        expect(file?.name).toBe('a.pdf');
      });
      test('get a nested file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const file = tree.getFileByPath('subfolder/c.pdf');
        expect(file).not.toBeUndefined();
        expect(file?.name).toBe('c.pdf');
      });
    });
    describe('getFileById', () => {
      test('get a top-level file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const file = tree.getFileById('a');
        expect(file).not.toBeUndefined();
        expect(file?.name).toBe('a.pdf');
      });
      test('get a nested file', () => {
        const tree = InsightFileTree.fromInsightFiles(filesA());

        const file = tree.getFileById('c');
        expect(file).not.toBeUndefined();
        expect(file?.path).toBe('subfolder/c.pdf');
      });
    });
  });
});
