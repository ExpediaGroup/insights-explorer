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

import { extendTheme } from '@chakra-ui/react';
import { createBreakpoints } from '@chakra-ui/theme-tools';
import { mode } from '@chakra-ui/theme-tools';

const breakpoints = createBreakpoints({
  sm: '30em',
  md: '48em',
  lg: '62em',
  xl: '80em'
});

export const IexTheme = extendTheme({
  useSystemColorMode: false,
  initialColorMode: 'light',
  breakpoints,
  colors: {
    nord: {
      100: '#f8f9fb'
    },
    polar: {
      100: '#2e3440',
      200: '#3b4252',
      300: '#434c5e',
      400: '#4c566a',
      500: '#566178',
      600: '#606b85'
    },
    snowstorm: {
      50: '#c5d1dd',
      100: '#d8dee9',
      200: '#e5e9f0',
      300: '#eceff4'
    },
    frost: {
      100: '#8fbcbb',
      200: '#88c0d0',
      300: '#81a1c1',
      400: '#5e81ac'
    },
    frostdark: {
      100: '#749998',
      200: '#70a0ad',
      300: '#69849e',
      400: '#4a6587'
    },
    aurora: {
      100: '#bf616a',
      200: '#d08770',
      300: '#ebcb8b',
      400: '#a3be8c',
      500: '#b48ead'
    },
    nord7: {
      50: '#f2f7f7',
      100: '#ddebeb',
      200: '#c7dedd',
      300: '#b1d0cf',
      400: '#a0c6c5',
      500: '#8fbcbb',
      600: '#87b6b5',
      700: '#7cadac',
      800: '#72a5a4',
      900: '#609796',
      A100: '#ffffff',
      A200: '#d3fffe',
      A400: '#a0fffd',
      A700: '#86fffd'
    },
    nord8: {
      50: '#f1f7f9',
      100: '#dbecf1',
      200: '#c4e0e8',
      300: '#acd3de',
      400: '#9ac9d7',
      500: '#88c0d0',
      600: '#80bacb',
      700: '#75b2c4',
      800: '#6baabe',
      900: '#589cb3',
      A100: '#ffffff',
      A200: '#e6f9ff',
      A400: '#b3ebff',
      A700: '#9ae5ff'
    },
    nord9: {
      50: '#f0f4f8',
      100: '#d9e3ec',
      200: '#c0d0e0',
      300: '#a7bdd4',
      400: '#94afca',
      500: '#81a1c1',
      600: '#7999bb',
      700: '#6e8fb3',
      800: '#6485ab',
      900: '#51749e',
      A100: '#ffffff',
      A200: '#cde3ff',
      A400: '#9ac7ff',
      A700: '#80b9ff'
    },
    nord10: {
      50: '#ecf0f5',
      100: '#cfd9e6',
      200: '#afc0d6',
      300: '#8ea7c5',
      400: '#7694b8',
      500: '#5e81ac',
      600: '#5679a5',
      700: '#4c6e9b',
      800: '#426492',
      900: '#315182',
      A100: '#ccdfff',
      A200: '#99c0ff',
      A400: '#66a0ff',
      A700: '#4d90ff'
    },
    nord11: {
      50: '#f7eced',
      100: '#ecd0d2',
      200: '#dfb0b5',
      300: '#d29097',
      400: '#c97980',
      500: '#bf616a',
      600: '#b95962',
      700: '#b14f57',
      800: '#a9454d',
      900: '#9b333c',
      A100: '#ffe5e7',
      A200: '#ffb2b7',
      A400: '#ff7f88',
      A700: '#ff6571'
    },
    nord12: {
      50: '#f9f1ee',
      100: '#f1dbd4',
      200: '#e8c3b8',
      300: '#deab9b',
      400: '#d79985',
      500: '#d08770',
      600: '#cb7f68',
      700: '#c4745d',
      800: '#be6a53',
      900: '#b35741',
      A100: '#ffffff',
      A200: '#ffdbd3',
      A400: '#ffb1a0',
      A700: '#ff9c86'
    },
    nord13: {
      50: '#fdf9f1',
      100: '#f9efdc',
      200: '#f5e5c5',
      300: '#f1dbae',
      400: '#eed39c',
      500: '#ebcb8b',
      600: '#e9c683',
      700: '#e5be78',
      800: '#e2b86e',
      900: '#ddac5b',
      A100: '#ffffff',
      A200: '#ffffff',
      A400: '#fff2de',
      A700: '#ffe8c4'
    },
    nord14: {
      50: '#f4f7f1',
      100: '#e3ecdd',
      200: '#d1dfc6',
      300: '#bfd2af',
      400: '#b1c89d',
      500: '#a3be8c',
      600: '#9bb884',
      700: '#91af79',
      800: '#88a76f',
      900: '#77995c',
      A100: '#ffffff',
      A200: '#e5ffd2',
      A400: '#c8ff9f',
      A700: '#baff85'
    },
    nord15: {
      50: '#f6f1f5',
      100: '#e9dde6',
      200: '#dac7d6',
      300: '#cbb0c6',
      400: '#bf9fb9',
      500: '#b48ead',
      600: '#ad86a6',
      700: '#a47b9c',
      800: '#9c7193',
      900: '#8c5f83',
      A100: '#fffcfe',
      A200: '#ffc9f4',
      A400: '#ff96e9',
      A700: '#ff7ce4'
    }
  },
  fonts: {},
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.7rem',
    '4xl': '1.95rem',
    '5xl': '2.25rem',
    '6xl': '2.6rem'
  },
  components: {
    Checkbox: {
      baseStyle: (props: Record<string, any>) => {
        return {
          icon: {
            bg: 'frost.100',
            borderColor: 'frost.100'
          },
          control: {
            _checked: {
              bg: 'frost.100',
              borderColor: 'frost.100'
            },
            _hover: {
              bg: mode('frost.400', 'snowstorm.400')(props),
              borderColor: mode('frost.400', 'snowstorm.400')(props)
            }
          }
        };
      }
    },
    Badge: {
      variants: {
        frost: {
          bg: 'frost.200'
        }
      }
    },
    Button: {
      baseStyle: {
        // This fixes https://github.com/chakra-ui/chakra-ui/issues/4255
        // TODO: Remove after this change is released
        rounded: 'md'
      },
      variants: {
        frost: {
          bg: 'nord8.500',
          _hover: {
            bg: 'nord8.800'
          }
        },
        polar: {
          bg: 'polar.600',
          color: 'snowstorm.300',
          _hover: {
            bg: 'polar.500'
          }
        }
      }
    },
    Popover: {
      variants: {
        responsive: {
          popper: {
            maxWidth: 'unset',
            width: 'unset'
          }
        }
      }
    },
    Tooltip: {
      baseStyle: (props: Record<string, any>) => {
        return {
          bg: props.colorMode === 'dark' ? 'snowstorm.50' : 'polar.300'
        };
      }
    }
  }
});
