<script setup lang="ts">
import { ref } from 'vue'

import Screen from '../Misc/Screen.vue'
import Live2DCanvas from './Live2D/Canvas.vue'
import Live2DModel from './Live2D/Model.vue'

import '../../utils/live2d-zip-loader'

withDefaults(defineProps<{
  modelSrc?: string

  paused?: boolean
  mouthOpenSize?: number
  focusAt?: { x: number, y: number }
  disableFocusAt?: boolean
  xOffset?: number | string
  yOffset?: number | string
  scale?: number
}>(), {
  paused: false,
  focusAt: () => ({ x: 0, y: 0 }),
  mouthOpenSize: 0,
  scale: 1,
})

const emit = defineEmits<{
  (e: 'motionStart', group: string, index: number): void
  (e: 'motionEnd'): void
  (e: 'hit', hitAreas: string[]): void
  (e: 'modelLoaded'): void
}>()

const live2dCanvasRef = ref<InstanceType<typeof Live2DCanvas>>()
const live2dModelRef = ref<InstanceType<typeof Live2DModel>>()

// Event handlers for motion events
function onMotionStart(group: string, index: number) {
  // Emit motion start event to parent
  emit('motionStart', group, index)
}

function onMotionEnd() {
  // Emit motion end event to parent
  emit('motionEnd')
}

function onHit(hitAreas: string[]) {
  // Emit hit event to parent
  emit('hit', hitAreas)
}

defineExpose({
  canvasElement: () => {
    return live2dCanvasRef.value?.canvasElement()
  },
  setExpression: (expressionName: string, overlapping?: boolean) => {
    return live2dModelRef.value?.setExpression(expressionName, overlapping)
  },
  unsetExpression: (expressionName: string) => {
    return live2dModelRef.value?.unsetExpression(expressionName)
  },
})
</script>

<template>
  <Screen v-slot="{ width, height }" relative>
    <Live2DCanvas
      ref="live2dCanvasRef"
      v-slot="{ app }"
      :width="width"
      :height="height"
      :resolution="2"
      max-h="100dvh"
    >
      <Live2DModel
        ref="live2dModelRef"
        :model-src="modelSrc"
        :app="app"
        :mouth-open-size="mouthOpenSize"
        :width="width"
        :height="height"
        :paused="paused"
        :focus-at="focusAt"
        :x-offset="xOffset"
        :y-offset="yOffset"
        :scale="scale"
        :disable-focus-at="disableFocusAt"
        @hit="onHit"
        @motion-start="onMotionStart"
        @motion-end="onMotionEnd"
        @model-loaded="emit('modelLoaded')"
      />
    </Live2DCanvas>
  </Screen>
</template>
