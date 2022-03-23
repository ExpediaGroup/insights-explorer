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

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

export interface LineSlice {
  start: number;
  end: number;
}

/**
 * Parses a lines string into the corresponding set of slices.
 * Returns slices in order, does not dedupe or clean up overlapping slices.
 *
 * Spec:
 *  - Zero or more "slices" separated by comma (,) or semicolon (;)
 *  - Whitespace trimmed from slices
 *  - Slices can either be:
 *      - A single line, e.g. "1"
 *      - Two line numbers separated by two periods (..), e.g. "1..3"
 *  - Line numbers are one-indexed and inclusive
 *  - A slice's end number can be larger than the end of the document
 *  - When a slice's end number is missing, it indicates a slice through the end of the document
 *  - When a slice's end number is negative, it indicates an offset from the end of the document
 *
 * Spec inspired by https://docs.asciidoctor.org/asciidoc/latest/directives/include-lines/
 * and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
 *
 * @param lineFilter Lines filter string
 */
export function parseLineFilter(lineFilter: string): LineSlice[] {
  if (lineFilter == null || lineFilter.length === 0) {
    return [];
  }

  const entries = lineFilter.trim().split(/[,;]/);

  const ranges: LineSlice[] = entries
    .map((entry: string) => {
      const parts = entry.trim().split('..');

      if (parts.length === 0 || parts.length > 2) {
        return undefined;
      }

      const start = Number.parseInt(parts[0]) - 1;
      let end = start + 1;

      if (parts.length === 2) {
        end = parts[1] === '' ? Number.POSITIVE_INFINITY : Number.parseInt(parts[1]);
      }

      return { start, end };
    })
    .filter(notEmpty);

  return ranges;
}

export function filterContentByLines(content: string, lineFilter: string | undefined): [string, number] {
  if (lineFilter === undefined) {
    return [content, 1];
  }

  const ranges = parseLineFilter(lineFilter);

  const lines = content.trim().split(/\r?\n/g) || [];

  if (ranges.length > 0) {
    const startingLineNumber = Math.min.apply(
      null,
      ranges.map((range) => range.start + 1)
    );
    const filteredContent = ranges
      .flatMap(({ start, end }) => {
        return lines.slice(start, end);
      })
      .join('\n');

    return [filteredContent, startingLineNumber];
  }

  return [content, 1];
}
