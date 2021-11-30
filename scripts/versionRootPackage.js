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

const fs = require("fs");
const { exec } = require("child_process");

const root = "..";
const pName = "package.json";
const pLockName = "package-lock.json";
const { version } = require(`${root}/lerna.json`);

let p;
let pLock;

const updateVersion = (file, version, json) => {
  json.version = version;

  return fs.writeFileSync(
    file,
    JSON.stringify(json, null, 2).concat("\n"),
    { encoding: "utf8", flag: "w" },
  );
}

if (fs.existsSync(pName)) {
  p = require(`${root}/${pName}`);
  updateVersion(pName, version, p);
}

if (fs.existsSync(pLockName)) {
  pLock = require(`${root}/${pLockName}`);
  updateVersion(pLockName, version, pLock);
}

exec(`git add ${pName} ${pLockName}`, (stdout, stderr) => {
  if (stdout) {
    console.log(stdout);
  }

  if (stderr) {
    console.error(stderr);
    process.exit(1);
  }
});
