/**
 * Copyright 2022 Expedia, Inc.
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

import {
  Flex,
  HStack,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  Icon
} from '@chakra-ui/react';
import { usePagination, useSortBy, useTable } from 'react-table';

import { iconFactory, iconFactoryAs } from '../../../shared/icon-factory';

export const TableRenderer = ({ columns, data }) => {
  const {
    canNextPage,
    canPreviousPage,
    getTableProps,
    getTableBodyProps,
    gotoPage,
    headers,
    nextPage,
    page,
    pageCount,
    pageOptions,
    prepareRow,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageSize: 25
      }
    },
    useSortBy,
    usePagination
  );

  return (
    <>
      <TableContainer>
        <Table {...getTableProps()}>
          <Thead>
            <Tr>
              {headers.map((header) => (
                <Th {...header.getHeaderProps(header.getSortByToggleProps())} fontSize="sm">
                  {header.render('Header')}
                  {header.isSorted && (
                    <Icon
                      as={iconFactory(header.isSortedDesc ? 'sortUp' : 'sortDown')}
                      ml="1rem"
                      display="inline-block"
                    />
                  )}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody {...getTableBodyProps()}>
            {page.map((row) => {
              prepareRow(row);
              return (
                <Tr {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return <Td {...cell.getCellProps()}>{cell.render('Cell')}</Td>;
                  })}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>

      <Flex justifyContent="space-between" align="center" p="0.25rem">
        <HStack>
          <Tooltip label="First Page">
            <IconButton
              onClick={() => gotoPage(0)}
              isDisabled={!canPreviousPage}
              icon={iconFactoryAs('paginateFirst')}
              aria-label="First Page"
            />
          </Tooltip>
          <Tooltip label="Previous Page">
            <IconButton
              onClick={previousPage}
              isDisabled={!canPreviousPage}
              icon={iconFactoryAs('paginateLeft')}
              aria-label="Previous Page"
            />
          </Tooltip>
        </HStack>

        <HStack spacing="2rem">
          <Text>
            Page {pageIndex + 1} of {pageOptions.length}
          </Text>
          <NumberInput
            defaultValue={pageIndex + 1}
            min={1}
            max={pageOptions.length}
            width="8rem"
            onChange={(_, value) => {
              const page = value ? value - 1 : 0;
              gotoPage(page);
            }}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>

          <Select
            width="10rem"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 25, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </Select>
        </HStack>

        <HStack>
          <Tooltip label="Next Page">
            <IconButton
              onClick={nextPage}
              isDisabled={!canNextPage}
              icon={iconFactoryAs('paginateRight')}
              aria-label="Next Page"
            />
          </Tooltip>
          <Tooltip label="Last Page">
            <IconButton
              onClick={() => gotoPage(pageCount - 1)}
              isDisabled={!canNextPage}
              icon={iconFactoryAs('paginateLast')}
              aria-label="Last Page"
            />
          </Tooltip>
        </HStack>
      </Flex>
    </>
  );
};
