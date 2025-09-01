<script setup lang="ts">
import { Screen } from '@proj-airi/stage-ui/components'
import { Live2DCanvas, Live2DModel } from '@proj-airi/stage-ui/components/scenes'
import { useSettings } from '@proj-airi/stage-ui/stores/settings'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'

const live2dCanvasRef = ref<InstanceType<typeof Live2DCanvas>>()
const live2dModelRef = ref<InstanceType<typeof Live2DModel>>()

const settingsStore = useSettings()
const { stageModelSelectedUrl } = storeToRefs(settingsStore)
const motion = ref<string | undefined>()
const motionGroupsList = ref<{
  motionName: string
  motionIndex: number
  fileName: string
}[]>([])

const expressionList = ref<{
  expressionName: string
  fileName: string
}[]>([])

const expression = ref<string | undefined>()

function download(href: string, name: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function handleSetMotion(motionName?: string) {
  const motionItem = motionGroupsList.value.find(item => item.fileName === motionName)
  if (!motionItem)
    return

  live2dModelRef.value?.setMotion(motionItem.motionName, motionItem.motionIndex)
}

function handleSetExpression(expressionName?: string) {
  if (!expressionName)
    return

  live2dModelRef.value?.setExpression(expressionName)
}

watch(live2dModelRef, (model) => {
  motionGroupsList.value = model?.listMotionGroups() || []
}, { immediate: true })

function handleModelLoaded() {
  if (live2dModelRef.value) {
    motionGroupsList.value = live2dModelRef.value.listMotionGroups()
    expressionList.value = live2dModelRef.value.listExpressions()
  }
}

function handleShot() {
  if (!live2dCanvasRef.value || !live2dModelRef.value)
    return

  const canvas = live2dCanvasRef.value.canvasElement()
  const dataUrl = canvas!.toDataURL('image/png')
  download(dataUrl, 'live2d-screenshot.png')
}
</script>

<template>
  <div flex flex-col items-center gap-4>
    <div h-full w-full>
      <Screen v-slot="{ width, height }" relative min-h-70dvh>
        <Live2DCanvas
          ref="live2dCanvasRef"
          v-slot="{ app }"
          :width="width"
          :height="height"
          :resolution="3"
          rounded-full
        >
          <Live2DModel
            ref="live2dModelRef"
            :model-src="stageModelSelectedUrl"
            :app="app"
            :width="width"
            :height="height"
            :focus-at="{ x: width / 2, y: height / 2 }"
            @model-loaded="handleModelLoaded"
          />
        </Live2DCanvas>
      </Screen>
    </div>
    <div>
      <select v-model="motion" rounded-lg px-3 py-2 @change="handleSetMotion(motion)">
        <option v-for="motionItem in motionGroupsList" :key="motionItem.motionIndex" :value="motionItem.fileName">
          {{ motionItem.fileName }}
        </option>
      </select>
    </div>
    <div>
      <select v-model="expression" rounded-lg px-3 py-2 @change="handleSetExpression(expression)">
        <option v-for="expressionItem in expressionList" :key="expressionItem.expressionName" :value="expressionItem.expressionName">
          {{ expressionItem.expressionName }}
        </option>
      </select>
    </div>
    <div border="2px solid black dark:white" flex items-center justify-center rounded-full p-1>
      <button
        class="h-15 w-15 md:h-18 md:w-18"
        bg="black active:neutral-950 dark:white dark:active:neutral-50"
        rounded-full outline-none transition-colors duration-200 ease-in-out
        @click="handleShot"
      />
    </div>
  </div>
</template>
