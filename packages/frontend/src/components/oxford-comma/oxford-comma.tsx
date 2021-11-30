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

import { Fragment, ReactNode } from 'react';

interface Props {
  items: ReactNode[];
  conjunction?: string;
}

export const OxfordComma = ({ items, conjunction = 'and' }: Props): JSX.Element => {
  const length = items.length;

  if (length === 1) {
    return <>{items[0]}</>;
  }

  const output: ReactNode[] = [];

  for (let i = 0; i < length; i++) {
    if (i === length - 1) {
      if (length > 2) {
        output.push(<Fragment key={`${i}-comma`}>,</Fragment>);
      }

      output.push(<Fragment key={`${i}-conj`}> {conjunction} </Fragment>);
    } else if (i !== 0) {
      output.push(<Fragment key={`${i}-comma`}>, </Fragment>);
    }

    output.push(<Fragment key={i}>{items[i]}</Fragment>);
  }

  return <>{output}</>;
};
