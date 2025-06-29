import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: [
      '#e8f4f8',
      '#b8d4e7',
      '#87b3d6',
      '#5693c5',
      '#2572b4',
      '#1e5f9b',
      '#174b82',
      '#103769',
      '#092350',
      '#021037',
    ],
    green: [
      '#e8f5e8',
      '#c3e6c3',
      '#9dd69d',
      '#77c677',
      '#51b651',
      '#3e9a3e',
      '#2e7d2e',
      '#1f611f',
      '#0f440f',
      '#002800',
    ],
    red: [
      '#ffe8e8',
      '#ffb3b3',
      '#ff7d7d',
      '#ff4747',
      '#ff1111',
      '#e60000',
      '#cc0000',
      '#b30000',
      '#990000',
      '#800000',
    ],
  },
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
})