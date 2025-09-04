import { useLocalStorage } from '@vueuse/core'
import { defineStore, storeToRefs } from 'pinia'
import { computed, watch } from 'vue'

import { AMI } from '../constants/characters/ami'
import { useSettings } from './settings'

export const useCharacterStore = defineStore('character', () => {
  const { stageModelSelected } = storeToRefs(useSettings())
  const appearanceState = useLocalStorage<Record<string, boolean>>('character/appearance', {})
  const character = computed(() => {
    if (stageModelSelected.value === 'preset-live2d-ami') {
      return AMI
    }
    return undefined
  })

  watch(character, () => {
    if (character.value) {
      for (const [appearanceName, appearance] of Object.entries(character.value.appearances)) {
        // Initialize appearance state if it doesn't exist, or update if it does
        if (!(appearanceName in appearanceState.value)) {
          appearanceState.value[appearanceName] = appearance.default
        }
      }
    }
  }, { immediate: true })

  function updateAppearanceState(appearanceName: string, value: boolean) {
    if (appearanceState.value[appearanceName] === value) {
      console.warn(`Appearance ${appearanceName} is already ${value}`)
    }

    appearanceState.value[appearanceName] = value
  }

  return {
    character,
    appearanceState,
    updateAppearanceState,
  }
})
