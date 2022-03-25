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

import fs from 'fs';
import path from 'path';

import type { Convertbot } from './lib/convertbot';
import { exec } from './lib/exec';

export const registerConversionMappings = (convertbot: Convertbot): void => {
  // .docx, .xlxs
  for (const mime of [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]) {
    convertbot.registerMappings({
      from: mime,
      to: 'application/pdf',
      apply: async (source) => {
        //await exec(`cp "${source}" "${target}"`);
        await exec(`unoconv -f pdf "${source}"`);
        return [source.slice(0, Math.max(0, source.lastIndexOf('.'))) + '.pdf'];
      }
    });
  }

  // .pptx
  convertbot.registerMappings({
    from: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    to: 'application/pdf',
    apply: async (source) => {
      const fileNameBase = source.slice(0, Math.max(0, source.lastIndexOf('.')));
      await exec(`unoconv -f pdf "${source}"`);
      const pdfFilename = `${fileNameBase}.pdf`;

      // Convert slides to images
      //await exec(`convert -density 400 ${pdfFilename} -resize 2000x1500 ${fileNameBase}-%d.png`);
      await exec(`gs -sDEVICE=pngalpha -o "${source}-%d.png" -r300 "${pdfFilename}"`);

      // Find all png images
      const images = fs
        .readdirSync(path.dirname(source))
        .filter((file) => {
          return file.endsWith('.png');
        })
        .map((file) => path.join(path.dirname(source), file));

      // Return pdf and images
      return [pdfFilename, ...images];
    }
  });

  // .ipynb
  convertbot.registerMappings(
    {
      from: 'application/x-ipynb+json',
      to: 'application/pdf',
      apply: async (source) => {
        await exec(`jupyter nbconvert --to pdf "${source}"`);
        return [source.slice(0, Math.max(0, source.lastIndexOf('.'))) + '.pdf'];
      }
    },
    {
      from: 'application/x-ipynb+json',
      to: 'text/html',
      apply: async (source) => {
        await exec(`jupyter nbconvert --to html "${source}"`);
        return [source.slice(0, Math.max(0, source.lastIndexOf('.'))) + '.html'];
      }
    },
    {
      from: 'application/x-ipynb+json',
      to: 'text/markdown',
      apply: async (source) => {
        await exec(`jupyter nbconvert --to markdown "${source}"`);
        return [source.slice(0, Math.max(0, source.lastIndexOf('.'))) + '.md'];
      }
    }
  );
};
