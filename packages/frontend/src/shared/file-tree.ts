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

import { freeze, produce } from 'immer';
import { nanoid } from 'nanoid';

import type { FileOrFolder, InsightFile, InsightFolder } from '../models/file-tree';
import { InsightFileAction } from '../models/file-tree';

const PATH_SEPARATOR = '/';

export function isFolder(treeItem: FileOrFolder): treeItem is InsightFolder {
  return 'tree' in treeItem;
}

export function isFile(treeItem: FileOrFolder): treeItem is InsightFile {
  return !isFolder(treeItem);
}

/**
 * Recursive tree of Files and Folders.
 *
 * Files and Folders are immutable (using Immer).
 */
export class InsightFileTree {
  private files: FileOrFolder[];

  constructor(files: FileOrFolder[]) {
    this.files = files;
  }

  public static fromInsightFiles(insightFiles: InsightFile[]) {
    return new InsightFileTree(convertFilesIntoTree(insightFiles));
  }

  clone() {
    return new InsightFileTree(this.files);
  }

  getFiles() {
    return this.files;
  }

  flatten() {
    return flatten(this.files);
  }

  getFileByPath(path: string, originalPath = false): FileOrFolder | undefined {
    const parts = path.split(PATH_SEPARATOR);

    const found = findByName(this.files, parts);
    if (found) {
      return found;
    }

    return findByName(this.files, parts, 'originalPath');
  }

  getFileById(id: string | undefined): FileOrFolder | undefined {
    if (id === undefined) {
      return undefined;
    }

    return findById(this.files, id);
  }

  /**
   * Adds a new item to the tree, using its `path` as its location
   *
   * If an item already exists at that location, it will be replaced!
   */
  addItem(newItem: FileOrFolder) {
    const paths = newItem.path.split(PATH_SEPARATOR);
    this.files = produce(this.files, (draft) => {
      addFileToTree(draft, newItem, paths);
    });
  }

  /**
   * Removes an item from the tree by following its `path`
   *
   * @param item Item to remove
   */
  removeItem(item: FileOrFolder) {
    const paths = item.path.split(PATH_SEPARATOR);
    this.files = produce(this.files, (draft) => {
      removeFileFromTree(draft, item, paths);
    });
  }

  /**
   * Moves an item in the tree by following its `path`
   *
   * @param partialItem (Partial) Item to move
   * @param newPath New path
   */
  moveItem(partialItem: Pick<FileOrFolder, 'id'> & Partial<FileOrFolder>, newPath: string) {
    this.files = produce(this.files, (draft) => {
      const item = findById(draft, partialItem.id) as InsightFile;

      if (item) {
        const paths = item.path.split(PATH_SEPARATOR);
        const newPaths = newPath.split(PATH_SEPARATOR);

        removeFileFromTree(draft, item, paths);
        item.originalPath ??= item.path;
        item.path = newPath;
        item.action ??= InsightFileAction.RENAME;
        addFileToTree(draft, item, newPaths);
      }
    });
  }
  /**
   * Updates an item by ID.
   *
   * If name is changed, path will be recalculated (and propagated to children)
   *
   * @param updatedItem
   */
  updateItemById(updatedItem: Pick<FileOrFolder, 'id'> & Partial<FileOrFolder>) {
    this.files = produce(this.files, (draft) => {
      const nested = findNestedById(draft, updatedItem.id);

      if (nested === undefined) {
        return;
      }

      const [item, parent] = nested;

      if (item) {
        // Is it a rename?
        if (updatedItem.name && item.name !== updatedItem.name) {
          if (item.path.includes(PATH_SEPARATOR)) {
            item.path =
              item.path.slice(0, Math.max(0, item.path.lastIndexOf(PATH_SEPARATOR))) +
              PATH_SEPARATOR +
              updatedItem.name;
          } else {
            item.path = updatedItem.name;
          }
          if (isFolder(item)) {
            updatePaths(item.tree, item.path);
          }
        }

        // Is it a deleted folder?
        if (updatedItem.action === 'delete' && isFolder(item)) {
          walkTree(item.tree, (i) => (i.action = 'delete' as InsightFileAction));
        }

        // Assign other fields
        Object.assign(item, updatedItem);

        // Resort parent
        if (parent && isFolder(parent)) {
          parent.tree.sort(sortFunction);
        } else if (parent === undefined) {
          draft.sort(sortFunction);
        }
      }
    });
  }
}

const sortFunction = (a: FileOrFolder, b: FileOrFolder): number => {
  if (isFolder(a) && isFile(b)) {
    return -1;
  }
  if (isFolder(b) && isFile(a)) {
    return 1;
  }
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }

  return 0;
};

export function convertFilesIntoTree(files: InsightFile[]): FileOrFolder[] {
  const tree: FileOrFolder[] = [];
  files.forEach((file) => {
    const paths = file.path.split(PATH_SEPARATOR);

    // Save original path: only do when converting from InsightFile[] to tree
    if (file.originalPath === undefined) {
      file.originalPath = file.path;
    }

    addFileToTree(tree, file, paths);
  });

  return freeze(tree, true);
}

export function addFileToTree(
  tree: FileOrFolder[],
  file: FileOrFolder,
  remainingPathParts: string[],
  accPath: string[] = []
) {
  if (remainingPathParts.length === 1) {
    // This is a file, push into the tree
    const existingFile = tree.find((f) => f.name === file.name);
    if (existingFile === undefined) {
      tree.push(file);
    } else {
      Object.assign(existingFile, file);
    }

    // Sort this branch of the tree
    tree.sort(sortFunction);
  } else {
    const [current, ...rest] = remainingPathParts;

    // Check for an existing folder
    const existingFolder: InsightFolder | undefined = tree.filter(isFolder).find((folder) => {
      return folder.name === current;
    });

    if (existingFolder) {
      addFileToTree(existingFolder.tree, file, rest, accPath.concat(current));
    } else {
      const newTree = {
        id: nanoid(),
        path: accPath.concat(current).join(PATH_SEPARATOR),
        name: current,
        tree: []
      };

      addFileToTree(newTree.tree, file, rest, accPath.concat(current));

      tree.push(newTree);
    }
  }
}

export function removeFileFromTree(tree: FileOrFolder[], file: FileOrFolder, remainingPathParts: string[]) {
  if (remainingPathParts.length === 1) {
    // This is a file, find it

    const existingFileIndex = tree.findIndex((f) => f.name === file.name);
    if (existingFileIndex !== undefined) {
      tree.splice(existingFileIndex, 1);
    }
  } else {
    const [current, ...rest] = remainingPathParts;

    // Check for an existing folder
    const existingFolder: InsightFolder | undefined = tree.filter(isFolder).find((folder) => {
      return folder.name === current;
    });

    if (existingFolder) {
      removeFileFromTree(existingFolder.tree, file, rest);
    }
  }
}

export function updatePaths(tree: FileOrFolder[], path: string) {
  tree.forEach((item) => {
    item.path = path + PATH_SEPARATOR + item.name;

    if (isFolder(item)) {
      updatePaths(item.tree, item.path);
    }
  });
}

export function flatten(tree: FileOrFolder[], path = '') {
  return tree.reduce<FileOrFolder[]>((acc, f) => {
    if (isFile(f)) {
      // Skip any files with a blank name
      if (f.name === '') {
        return acc;
      }

      return acc.concat({
        ...f,
        // Recalculate the path of each item in case its parents changed
        path: path + f.name
      });
    }

    return acc.concat(flatten(f.tree, path + f.name + PATH_SEPARATOR));
  }, []);
}

export function walkTree(tree: FileOrFolder[], callback: (treeItem: FileOrFolder) => void): void {
  if (tree === undefined || tree === null) {
    return;
  }

  tree.forEach((item) => {
    callback(item);

    if (isFolder(item)) {
      walkTree(item.tree, callback);
    }
  });
}

/**
 * Retrieves an item by ID, along with all of its parents in reverse order (item, parent, grandparent, ...)
 */
export function findNestedById(
  tree: FileOrFolder[],
  id: string,
  parents: FileOrFolder[] = []
): undefined | FileOrFolder[] {
  const item = tree.find((f) => f.id === id);

  if (item !== undefined) {
    return [item, ...parents];
  }

  for (const item of tree) {
    if (isFolder(item)) {
      const found = findNestedById(item.tree, id, [item, ...parents]);
      if (found !== undefined) {
        return found;
      }
    }
  }
}

/**
 * Retrieves an item by ID
 */
export function findById(tree: FileOrFolder[], id: string): undefined | FileOrFolder {
  const nested = findNestedById(tree, id);
  if (nested !== undefined) {
    return nested.shift();
  }
}

export function findByName(tree: FileOrFolder[], nameParts: string[], field = 'name'): undefined | FileOrFolder {
  const [current, ...rest] = nameParts;
  const item = tree.find((f) => f[field] === current);

  if (item === undefined) {
    return undefined;
  }

  if (nameParts.length === 1) {
    return item;
  }

  if (isFolder(item)) {
    return findByName(item.tree, rest);
  }

  return item;
}
