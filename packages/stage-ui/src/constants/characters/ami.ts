// this is the live2d model of ptit

import type { Appearance } from './types'

export const AMI: {
  appearances: Record<string, Appearance>
} = {
  appearances:
  {
    glass: {
      default: true,
      expression: 'Glasses Toggle',
      name: 'Glasses',
    },
    jacket: {
      default: true,
      expression: 'Jacket Toggle',
      name: 'Jacket',
    },
  },
}
