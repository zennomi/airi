import { storeToRefs } from 'pinia'
import { watch } from 'vue'

import { useCharacterStore } from '../../stores/character'

export function useAppearanceExpressions(options: {
  stageModelRenderer: { value: string | undefined }
  live2dSceneRef: { value?: { setExpression: (name: string, overlapping?: boolean) => any, unsetExpression: (name: string) => any } | undefined }
}) {
  const { stageModelRenderer, live2dSceneRef } = options
  const { appearanceState, character } = storeToRefs(useCharacterStore())

  let previousAppearanceState: Record<string, boolean> = { ...appearanceState.value }

  function applyAppearanceState() {
    if (stageModelRenderer.value !== 'live2d' || !live2dSceneRef.value)
      return

    const char = character.value
    if (!char?.appearances)
      return

    for (const [name, value] of Object.entries(appearanceState.value)) {
      const appearance = char.appearances[name]
      if (!appearance?.expression)
        continue

      if (value !== appearance.default)
        live2dSceneRef.value.setExpression(appearance.expression, true)
    }
  }

  watch(appearanceState, (newState) => {
    if (stageModelRenderer.value !== 'live2d' || !live2dSceneRef.value)
      return

    const char = character.value
    if (!char?.appearances)
      return

    for (const [name, value] of Object.entries(newState)) {
      const previous = previousAppearanceState[name]
      if (previous === value)
        continue

      const appearance = char.appearances[name]

      if (value === appearance.default)
        live2dSceneRef.value.unsetExpression(appearance.expression)
      else
        live2dSceneRef.value.setExpression(appearance.expression, true)
    }

    previousAppearanceState = { ...newState }
  }, { deep: true, immediate: true })

  return {
    applyAppearanceState,
  }
}
