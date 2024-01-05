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
import { describe, expect, test } from 'vitest';

import { getType, getTypeAsync } from '../../src/shared/mime';

describe('mime', () => {
  describe('getType', () => {
    test('unknown', () => {
      const type = getType('hufflepuff.wizard');
      expect(type).toBe('application/unknown');
    });
    test('long paths', () => {
      const type = getType('/a/long/path/to/image.png');
      expect(type).toBe('image/png');
    });
    test('png', () => {
      const type = getType('image.png');
      expect(type).toBe('image/png');
    });
    test('gif', () => {
      const type = getType('image.gif');
      expect(type).toBe('image/gif');
    });
    test('jpg', () => {
      const type = getType('image.jpg');
      expect(type).toBe('image/jpeg');
    });
    test('svg', () => {
      const type = getType('image.svg');
      expect(type).toBe('image/svg+xml');
    });
    test('markdown', () => {
      const type = getType('README.md');
      expect(type).toBe('text/markdown');
    });
    test('text', () => {
      const type = getType('license.txt');
      expect(type).toBe('text/plain');
    });
    test('html', () => {
      const type = getType('index.html');
      expect(type).toBe('text/html');
    });
    test('pdf', () => {
      const type = getType('archive.pdf');
      expect(type).toBe('application/pdf');
    });
    test('xml', () => {
      const type = getType('data.xml');
      expect(type).toBe('application/xml');
    });
    test('json', () => {
      const type = getType('data.json');
      expect(type).toBe('application/json');
    });
    test('yml', () => {
      const type = getType('data.yml');
      expect(type).toBe('text/yaml');
    });
    test('zip', () => {
      const type = getType('archive.zip');
      expect(type).toBe('application/zip');
    });
    test('7z', () => {
      const type = getType('archive.7z');
      expect(type).toBe('application/x-7z-compressed');
    });
    test('jar', () => {
      const type = getType('archive.jar');
      expect(type).toBe('application/java-archive');
    });
    test('javascript', () => {
      const type = getType('code.js');
      expect(type).toBe('application/javascript');
    });
    test('typescript', () => {
      const type = getType('code.ts');
      expect(type).toBe('application/x-typescript');
    });
    test('java', () => {
      const type = getType('code.java');
      expect(type).toBe('text/x-java-source');
    });
    test('python', () => {
      const type = getType('code.py');
      expect(type).toBe('text/x-python');
    });
    test('sql', () => {
      const type = getType('code.sql');
      expect(type).toBe('application/x-sql');
    });
    test('go', () => {
      const type = getType('code.go');
      expect(type).toBe('text/x-go');
    });
    test('scala', () => {
      const type = getType('code.scala');
      expect(type).toBe('text/x-scala');
    });
    test('clojure', () => {
      const type = getType('code.clj');
      expect(type).toBe('text/x-clojure');
    });
    test('ruby', () => {
      const type = getType('code.rb');
      expect(type).toBe('text/x-ruby');
    });
    test('excel (xls)', () => {
      const type = getType('code.xls');
      expect(type).toBe('application/vnd.ms-excel');
    });
    test('excel', () => {
      const type = getType('code.xlsx');
      expect(type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
    test('powerpoint (ppt)', () => {
      const type = getType('powerpoint.ppt');
      expect(type).toBe('application/vnd.ms-powerpoint');
    });
    test('powerpoint', () => {
      const type = getType('powerpoint.pptx');
      expect(type).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    });
    test('word document (doc)', () => {
      const type = getType('word.doc');
      expect(type).toBe('application/msword');
    });
    test('word document', () => {
      const type = getType('word.docx');
      expect(type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
    test('.gitignore', () => {
      const type = getType('.gitignore');
      expect(type).toBe('text/plain');
    });
    test('groovy', () => {
      const type = getType('code.groovy');
      expect(type).toBe('text/x-groovy');
    });
    test('Jenkinsfile', () => {
      const type = getType('Jenkinsfile');
      expect(type).toBe('text/x-groovy');
    });
    test('Jenkins pipeline', () => {
      const type = getType('Jenkins.pipeline');
      expect(type).toBe('text/x-groovy');
    });
    test('sh', () => {
      const type = getType('script.sh');
      expect(type).toBe('application/x-sh');
    });
    test('drawio', () => {
      const type = getType('diagram.drawio');
      expect(type).toBe('application/xml');
    });
    test('ipynb', () => {
      const type = getType('notebook.ipynb');
      expect(type).toBe('application/x-ipynb+json');
    });
    test('mov', () => {
      const type = getType('video.mov');
      expect(type).toBe('video/quicktime');
    });
    test('mpg', () => {
      const type = getType('video.mpg');
      expect(type).toBe('video/mpeg');
    });
    test('mp4', () => {
      const type = getType('video.mp4');
      expect(type).toBe('video/mp4');
    });
    test('avi', () => {
      const type = getType('video.avi');
      expect(type).toBe('video/x-msvideo');
    });
    test('webm', () => {
      const type = getType('video.webm');
      expect(type).toBe('video/webm');
    });
    test('R', () => {
      const type = getType('code.r');
      const type2 = getType('code.R');
      expect(type).toBe('text/x-r');
      expect(type2).toBe('text/x-r');
    });
  });
  describe('getTypeAsync', () => {
    test('Jenkinsfile (filename)', async () => {
      const type = await getTypeAsync({ fileName: 'Jenkinsfile' });
      expect(type).toBe('text/x-groovy');
    });
    test('xml (filename)', async () => {
      const type = await getTypeAsync({ fileName: 'a.xml' });
      expect(type).toBe('application/xml');
    });
    test('xml (buffer)', async () => {
      const type = await getTypeAsync({ fileName: 'a.unknown', buffer: Buffer.from('<?xml version="1.0"?><a></a>') });
      expect(type).toBe('application/xml');
    });
    test('xml (buffer only)', async () => {
      const type = await getTypeAsync({ buffer: Buffer.from('<?xml version="1.0"?><a></a>') });
      expect(type).toBe('application/xml');
    });
    test('unknown (buffer only)', async () => {
      const type = await getTypeAsync({ buffer: Buffer.from('gibberish') });
      expect(type).toBe('application/unknown');
    });
  });
});
