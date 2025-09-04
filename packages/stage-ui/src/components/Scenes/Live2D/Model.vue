<script setup lang="ts">
import type { Application } from '@pixi/app'
import type { Cubism4InternalModel, InternalModel } from 'pixi-live2d-display/cubism4'

import { breakpointsTailwind, until, useBreakpoints, useDebounceFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { Live2DFactory, Live2DModel } from 'pixi-live2d-display/cubism4'
import { computed, onUnmounted, ref, toRef, watch } from 'vue'

import { useLive2DIdleEyeFocus } from '../../../composables/live2d'
import { EMOTION_EmotionMotionName_value, EmotionNeutralMotionName } from '../../../constants/emotions'
import { useLive2d } from '../../../stores/live2d'

type CubismModel = Cubism4InternalModel['coreModel']
type CubismEyeBlink = Cubism4InternalModel['eyeBlink']
type PixiLive2DInternalModel = InternalModel & {
  eyeBlink?: CubismEyeBlink
  coreModel: CubismModel
}

const props = withDefaults(defineProps<{
  modelSrc?: string

  app?: Application
  mouthOpenSize?: number
  width: number
  height: number
  paused?: boolean
  focusAt?: { x: number, y: number }
  disableFocusAt?: boolean
  xOffset?: number | string
  yOffset?: number | string
  scale?: number
}>(), {
  mouthOpenSize: 0,
  paused: false,
  focusAt: () => ({ x: 0, y: 0 }),
  disableFocusAt: false,
  scale: 1,
})

const emits = defineEmits<{
  (e: 'modelLoaded'): void
  (e: 'motionStart', group: string, index: number): void
  (e: 'motionEnd'): void
  (e: 'hit', hitAreas: string[]): void
}>()

function parsePropsOffset() {
  let xOffset = Number.parseFloat(String(props.xOffset)) || 0
  let yOffset = Number.parseFloat(String(props.yOffset)) || 0

  if (String(props.xOffset).endsWith('%')) {
    xOffset = (Number.parseFloat(String(props.xOffset).replace('%', '')) / 100) * props.width
  }
  if (String(props.yOffset).endsWith('%')) {
    yOffset = (Number.parseFloat(String(props.yOffset).replace('%', '')) / 100) * props.height
  }

  return {
    xOffset,
    yOffset,
  }
}

const modelSrcRef = toRef(() => props.modelSrc)

const modelLoading = ref(false)

const offset = computed(() => parsePropsOffset())

const pixiApp = toRef(() => props.app)
const paused = toRef(() => props.paused)
const focusAt = toRef(() => props.focusAt)
const model = ref<Live2DModel<PixiLive2DInternalModel>>()
const initialModelWidth = ref<number>(0)
const initialModelHeight = ref<number>(0)
const mouthOpenSize = computed(() => Math.max(0, Math.min(100, props.mouthOpenSize)))
const lastUpdateTime = ref(0)

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = computed(() => breakpoints.between('sm', 'md').value || breakpoints.smaller('sm').value)
const idleEyeFocus = useLive2DIdleEyeFocus()

function getCoreModel() {
  return model.value!.internalModel.coreModel as any
}

function setScaleAndPosition() {
  if (!model.value)
    return

  let offsetFactor = 2.2
  if (isMobile.value) {
    offsetFactor = 2.2
  }

  const heightScale = (props.height * 0.95 / initialModelHeight.value * offsetFactor)
  const widthScale = (props.width * 0.95 / initialModelWidth.value * offsetFactor)
  const scale = Math.min(heightScale, widthScale)

  model.value.scale.set(scale * props.scale, scale * props.scale)

  model.value.x = (props.width / 2) + offset.value.xOffset
  model.value.y = props.height + offset.value.yOffset
}

const {
  currentMotion,
  availableMotions,
  availableExpressions,
  motionMap,
} = storeToRefs(useLive2d())

const localCurrentMotion = ref<{ group: string, index: number }>({ group: 'Idle', index: 0 })

async function loadModel() {
  await until(modelLoading).not.toBeTruthy()

  modelLoading.value = true

  if (!pixiApp.value) {
    modelLoading.value = false
    return
  }

  if (model.value) {
    pixiApp.value.stage.removeChild(model.value)
    model.value.destroy()
    model.value = undefined
  }
  if (!modelSrcRef.value) {
    console.warn('No Live2D model source provided.')
    modelLoading.value = false
    return
  }

  try {
    const modelInstance = new Live2DModel<PixiLive2DInternalModel>()
    if (modelSrcRef.value.startsWith('blob:')) {
      const res = await fetch(modelSrcRef.value)
      const blob = await res.blob()
      await Live2DFactory.setupLive2DModel(modelInstance, [new File([blob], 'model.zip')], { autoInteract: false })
    }
    else {
      await Live2DFactory.setupLive2DModel(modelInstance, modelSrcRef.value, { autoInteract: false })
    }

    modelInstance.interactive = true

    model.value = modelInstance
    pixiApp.value.stage.addChild(model.value)
    initialModelWidth.value = model.value.width
    initialModelHeight.value = model.value.height
    model.value.anchor.set(0.5, 0.5)
    setScaleAndPosition()

    const internalModel = model.value.internalModel
    const coreModel = internalModel.coreModel
    const motionManager = internalModel.motionManager
    coreModel.setParameterValueById('ParamMouthOpenY', mouthOpenSize.value)

    model.value.on('hit', (hitAreas) => {
      emits('hit', hitAreas)
    })

    const EMOTION_VALUES = Object.values(EMOTION_EmotionMotionName_value)

    Object.keys(motionManager.definitions).forEach((motion) => {
      if (motionMap.value[motion])
        return

      if (motion in EMOTION_VALUES) {
        motionMap.value[motion] = motion
      }
      else {
        motionMap.value[motion] = EmotionNeutralMotionName
      }
    })

    availableMotions.value = Object.entries(motionManager.definitions).flatMap(([motionName, definition]) => {
      if (!definition)
        return []

      return definition.map((motion: any, index: number) => ({
        motionName,
        motionIndex: index,
        fileName: motion.File,
      }))
    }).filter(Boolean)

    availableExpressions.value = (motionManager.expressionManager?.definitions || []).map((expression) => {
      return {
        expressionName: expression.Name,
        fileName: expression.File,
      }
    }).filter(Boolean)

    // Remove eye ball movements from idle motion group to prevent conflicts
    // This is too hacky
    // FIXME: it cannot blink if loading a model only have idle motion
    if (motionManager.groups.idle) {
      motionManager.motionGroups[motionManager.groups.idle]?.forEach((motion) => {
        motion._motionData.curves.forEach((curve: any) => {
        // TODO: After emotion mapper, stage editor, eye related parameters should be take cared to be dynamical instead of hardcoding
          if (curve.id === 'ParamEyeBallX' || curve.id === 'ParamEyeBallY') {
            curve.id = `_${curve.id}`
          }
        })
      })
    }

    // This is hacky too
    const hookedUpdate = motionManager.update as (model: CubismModel, now: number) => boolean
    motionManager.update = function (model: CubismModel, now: number) {
      lastUpdateTime.value = now

      hookedUpdate?.call(this, model, now)
      // Possibility 1: Only update eye focus when the model is idle
      // Possibility 2: For models having no motion groups, currentGroup will be undefined while groups can be { idle: ... }
      if (!motionManager.state.currentGroup || motionManager.state.currentGroup === motionManager.groups.idle) {
        idleEyeFocus.update(internalModel, now)

        // If the model has eye blink parameters
        if (internalModel.eyeBlink != null) {
        // For the part of the auto eye blink implementation in pixi-live2d-display
        //
        // this.emit("beforeMotionUpdate");
        // const motionUpdated = this.motionManager.update(this.coreModel, now);
        // this.emit("afterMotionUpdate");
        // model.saveParameters();
        // this.motionManager.expressionManager?.update(model, now);
        // if (!motionUpdated) {
        //   this.eyeBlink?.updateParameters(model, dt);
        // }
        //
        // https://github.com/guansss/pixi-live2d-display/blob/31317b37d5e22955a44d5b11f37f421e94a11269/src/cubism4/Cubism4InternalModel.ts#L202-L214
        //
        // If the this.motionManager.update returns true, as motion updated flag on,
        // the eye blink parameters will not be updated, in another hand, the auto eye blink is disabled
        //
        // Since we are hooking the motionManager.update method currently,
        // and previously a always `true` was returned, eye blink parameters were never updated.
        //
        // Thous we are here to manually update the eye blink parameters within this hooked method
          internalModel.eyeBlink.updateParameters(model, (now - lastUpdateTime.value) / 1000)
        }

        // still, mark the motion as updated
        return true
      }

      return false
    }

    motionManager.on('motionStart', (group, index) => {
      localCurrentMotion.value = { group, index }
      emits('motionStart', group, index)
    })

    motionManager.on('motionFinish', () => {
      emits('motionEnd')
    })

    emits('modelLoaded')
  }
  finally {
    modelLoading.value = false
  }
}

async function setMotion(motionName: string, index?: number) {
  // TODO: motion? Not every Live2D model has motion, we do need to help users to set motion
  return !!(await model.value?.motion(motionName, index))
}

async function setExpression(expressionName: string, overlapping = false) {
  return !!(await model.value?.internalModel.motionManager.expressionManager?.setExpression(expressionName, overlapping))
}

async function unsetExpression(expressionName: string) {
  return !!(await model.value?.internalModel.motionManager.expressionManager?.unsetExpression(expressionName))
}

const handleResize = useDebounceFn(setScaleAndPosition, 100)

const dropShadowAnimationId = ref(0)

watch([() => props.width, () => props.height], () => handleResize())
watch(modelSrcRef, async () => await loadModel(), { immediate: true })

watch(offset, setScaleAndPosition)
watch(() => props.scale, setScaleAndPosition)

watch(mouthOpenSize, value => getCoreModel().setParameterValueById('ParamMouthOpenY', value))
watch(currentMotion, value => setMotion(value.group, value.index))
watch(paused, value => value ? pixiApp.value?.stop() : pixiApp.value?.start())

watch(focusAt, (value) => {
  if (!model.value)
    return
  if (props.disableFocusAt)
    return

  model.value.focus(value.x, value.y)
})

function componentCleanUp() {
  cancelAnimationFrame(dropShadowAnimationId.value)
  model.value && pixiApp.value?.stage.removeChild(model.value)
}
onUnmounted(() => {
  componentCleanUp()
})

function listMotionGroups() {
  return availableMotions.value
}

function listExpressions() {
  return availableExpressions.value
}

defineExpose({
  setMotion,
  setExpression,
  unsetExpression,
  listMotionGroups,
  listExpressions,
})

if (import.meta.hot) {
  // Ensure cleanup on HMR
  import.meta.hot.dispose(() => {
    componentCleanUp()
  })
}
</script>

<template>
  <slot />
</template>
