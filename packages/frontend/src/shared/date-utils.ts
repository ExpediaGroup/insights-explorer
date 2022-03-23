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

import type { DateTimeFormatOptions, ToRelativeOptions } from 'luxon';
import { DateTime } from 'luxon';

import { store } from '../store/store';

export const availableLocales = [
  'de',
  'en-AU',
  'en-CA',
  'en-GB',
  'en-IN',
  'en-NZ',
  'en-US',
  'es',
  'fr',
  'fr-CH',
  'ja',
  'zh-CN'
];

export function formatDateIntl(
  dateTimeOrString: Date | DateTime | string,
  format: DateTimeFormatOptions | string = DateTime.DATETIME_MED,
  locale?: string
): string {
  let dt: DateTime;

  if (dateTimeOrString == null) {
    return '';
  }

  if (typeof dateTimeOrString == 'string') {
    dt = DateTime.fromISO(dateTimeOrString);
  } else if (dateTimeOrString instanceof Date) {
    dt = DateTime.fromJSDate(dateTimeOrString);
  } else {
    dt = dateTimeOrString;
  }

  if (locale == null) {
    locale = store?.getState().user.userInfo?.locale;
  }
  if (locale == null) {
    return typeof format == 'string' ? dt.toFormat(format) : dt.toLocaleString(format);
  }

  return typeof format == 'string'
    ? dt.setLocale(locale).toFormat(format)
    : dt.setLocale(locale).toLocaleString(format);
}

export function formatRelativeIntl(
  dateTimeOrString: DateTime | string,
  options: ToRelativeOptions = {},
  locale?: string
): string | null {
  const dt = typeof dateTimeOrString == 'string' ? DateTime.fromISO(dateTimeOrString) : dateTimeOrString;

  if (locale == null) {
    locale = store?.getState().user.userInfo?.locale;
  }
  if (locale == null) {
    return dt.toRelative(options);
  }

  return dt.setLocale(locale).toRelative(options);
}
