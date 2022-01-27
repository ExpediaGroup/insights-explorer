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

/* eslint-disable import/namespace */
/* eslint-disable no-console */
/* eslint-disable unicorn/no-process-exit */
/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs-extra';
import _ from 'lodash';
import { dumpLicenses } from 'npm-license-crawler';

const allOptions = {
  start: ['.'],
  exclude: [],
  json: './scripts/third-party-licenses/licenses-all.json',
  production: true,
  relativeLicensePath: true
};

const directOptions = {
  ...allOptions,
  onlyDirectDependencies: true,
  json: './scripts/third-party-licenses/licenses.json'
};

// Direct depencencies only
dumpLicenses(directOptions, (error: any, res: Record<string, any>) => {
  if (error) {
    console.error('Error:', error);
    return process.exit(1);
  }
});

// Direct and transitive dependencies
dumpLicenses(allOptions, (error: any, res: Record<string, any>) => {
  if (error) {
    console.error('Error:', error);
    return process.exit(1);
  }

  console.log('------');
  generateThirdPartyNotices(res);
});

async function generateThirdPartyNotices(json: Record<string, any>) {
  const licenses: any[] = [];
  for (const key of Object.keys(json)) {
    // Skip these internal modules
    if (key.startsWith('insights-explorer') || key.startsWith('@iex/')) {
      continue;
    }

    const obj = json[key];
    obj.module = key;
    licenses.push(obj);
  }

  const file = './THIRD-PARTY-NOTICES.md';

  await fs.outputFile(file, '');
  printHeader(file);
  printLicenseSummary(file, licenses);
  printLicenseDetails(file, licenses);
}

function printHeader(file: string) {
  fs.appendFileSync(
    file,
    `# THIRD-PARTY SOFTWARE NOTICES AND INFORMATION
_Do Not Translate or Localize_

Insights Explorer incorporates components from the projects listed below in accordance with the license terms of each component.

The original copyright notices and the licenses under which each component is used are set forth below for informational purposes.\n`
  );
}

async function printLicenseSummary(file: string, licenses: any[]) {
  const groups = _.groupBy(licenses, (l) => l.licenses);

  fs.appendFileSync(file, '\n## Summary\n\n');

  //console.log(groups);
  for (const groupKey of Object.keys(groups)) {
    const licenseCategory = groups[groupKey];
    console.log('Summary for ' + groupKey);
    console.log('There are ' + licenseCategory.length + ' items in this group');

    fs.appendFileSync(file, `\n### ${groupKey}\n\n`);
    for (const license of licenseCategory) {
      fs.appendFileSync(file, `- ${license.module} ${license.repository}\n`);
    }
  }
}

function getLicensePath(license: any): string {
  let relativePath = license.licenseFile;
  if (license.parents && license.parents.startsWith('@iex/')) {
    const packageName = license.parents.replace('@iex/', '');
    relativePath = `packages/${packageName}/${relativePath}`;
  }
  return `${__dirname}/../${relativePath}`;
}

async function printLicenseDetails(file: string, licenses: any[]) {
  fs.appendFileSync(file, '\n## Licenses\n\n');

  //console.log(groups);
  for (const license of licenses) {
    fs.appendFileSync(file, `\n### ${license.module}\n\n`);

    try {
      const licensePath = getLicensePath(license);
      const licenseText = fs.readFileSync(licensePath, 'utf8');
      fs.appendFileSync(file, `\n\`\`\`\n${licenseText}\n\`\`\`\n\n`);
    } catch {
      fs.appendFileSync(file, `License text could not be loaded Please refer to ${license.licenseUrl}.\n`);
    }
  }
}
