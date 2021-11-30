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

import { useParams } from 'react-router-dom';

import { iconFactory } from '../../shared/icon-factory';
import { ErrorPage } from '../error-page/error-page';

export const InsightNotFoundPage = () => {
  const { owner, name } = useParams();

  const props = {
    icon: iconFactory('insightMissing'),
    errorCode: 'Insight Not Found',
    message: (
      <>
        We have a lot of Insights, but{' '}
        <strong>
          {owner}/{name}
        </strong>{' '}
        isn't one of them. Feel free to take this name for yourself!
      </>
    )
  };

  return <ErrorPage {...props} />;
};
