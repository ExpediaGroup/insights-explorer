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

import type { BoxProps } from '@chakra-ui/react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  StackDivider,
  Text,
  Tooltip,
  useColorMode,
  VStack,
  Wrap
} from '@chakra-ui/react';
import { DateTime } from 'luxon';
import ReactDatePicker from 'react-datepicker';

import 'react-datepicker/dist/react-datepicker.css';
import { iconFactory, iconFactoryAs } from '../../shared/icon-factory';
import '../date-picker/date-picker.css';

interface Props {
  id: string;
  startDate?: string;
  endDate?: string;
  onChange: (startDate: string, endDate: string) => void;
  onClear: () => void;
  'aria-label': string;
}

function generateLink(startDate?: string, endDate?: string) {
  if (startDate || endDate) {
    return `${startDate} to ${endDate}`;
  }

  return (
    <HStack color="polar.400">
      <Icon as={iconFactory('calendar')} />
      <Text as="em">Click to select...</Text>
    </HStack>
  );
}

function parseDate(dateString: string | undefined): Date | undefined {
  if (dateString === undefined || dateString === '') {
    return undefined;
  }
  const date = DateTime.fromISO(dateString);

  return date.isValid ? date.toJSDate() : undefined;
}

const RelativeDateLink = ({ start, end, onChange, children }) => {
  return (
    <Link onClick={() => onChange(start, end)} color="frost.400">
      {children}
    </Link>
  );
};

export const DateRange = ({
  id,
  startDate,
  endDate,
  onChange,
  onClear,
  'aria-label': ariaLabel,
  ...boxProps
}: Props & Omit<BoxProps, 'onChange'>) => {
  let startString = startDate || '';
  let endString = endDate || '';
  const startAsDate = parseDate(startDate);
  const endAsDate = parseDate(endDate);

  const isLight = useColorMode().colorMode === 'light';

  const onChangeStart = (date) => {
    if (date instanceof Date) {
      date = DateTime.fromJSDate(date).toISODate();
    }

    startString = date;

    if (endString === '') {
      endString = 'now';
    }

    onChange(startString, endString);
  };

  const onChangeEnd = (date) => {
    if (date instanceof Date) {
      date = DateTime.fromJSDate(date).toISODate();
    }
    endString = date;

    onChange(startString, endString);
  };

  return (
    <Box {...boxProps}>
      <Popover placement="auto-start" variant="responsive">
        <PopoverTrigger>
          <HStack spacing="0.5rem">
            <Button variant="link" fontWeight="normal">
              {generateLink(startDate, endDate)}
            </Button>
            {(startString !== '' || endString !== '') && (
              <Tooltip placement="left" label="Clear this filter" aria-label="Clear this filter">
                <IconButton
                  variant="solid"
                  size="xs"
                  bgColor="frost.200"
                  icon={iconFactoryAs('close')}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  aria-label="Clear this filter"
                />
              </Tooltip>
            )}
          </HStack>
        </PopoverTrigger>
        <Portal>
          <PopoverContent maxWidth="unset" width="auto" aria-label={ariaLabel}>
            <PopoverArrow />
            <PopoverBody boxShadow="lg">
              <VStack align="stretch">
                <HStack spacing="0.5rem" align="end">
                  <FormControl id={`${id}-date-range-from`}>
                    <FormLabel>From</FormLabel>
                    <Input value={startString} onChange={(e) => onChangeStart(e.target.value)} />
                  </FormControl>
                  <FormControl id={`${id}-date-range-to`}>
                    <FormLabel>To</FormLabel>
                    <Input value={endString} onChange={(e) => onChangeEnd(e.target.value)} />
                  </FormControl>
                </HStack>
                <StackDivider borderColor="snowstorm.100" borderTopWidth="1px" />
                <Text as="strong" fontSize="sm">
                  Absolute Dates
                </Text>
                <HStack
                  spacing="0.5rem"
                  align="flex-start"
                  justify="space-between"
                  className={isLight ? 'light-theme' : 'dark-theme'}
                >
                  <ReactDatePicker selected={startAsDate} onChange={(date) => onChangeStart(date)} inline />
                  <ReactDatePicker selected={endAsDate} onChange={(date) => onChangeEnd(date)} inline />
                </HStack>
                <StackDivider borderColor="snowstorm.100" borderTopWidth="1px" />
                <Text as="strong" fontSize="sm">
                  Relative Dates
                </Text>
                <Wrap>
                  <HStack spacing="0.5rem">
                    <Link onClick={() => onChange('now/d', 'now')} color="frost.400">
                      Today
                    </Link>
                    <RelativeDateLink start="now-1d/d" end="now/d" onChange={onChange}>
                      Yesterday
                    </RelativeDateLink>
                    <RelativeDateLink start="now/w" end="now" onChange={onChange}>
                      This Week
                    </RelativeDateLink>
                    <RelativeDateLink start="now/M" end="now" onChange={onChange}>
                      This Month
                    </RelativeDateLink>
                    <RelativeDateLink start="now-1M/M" end="now/M" onChange={onChange}>
                      Last Month
                    </RelativeDateLink>
                    <RelativeDateLink start="now-6M/M" end="now" onChange={onChange}>
                      Last 6 Months
                    </RelativeDateLink>
                  </HStack>
                </Wrap>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    </Box>
  );
};
