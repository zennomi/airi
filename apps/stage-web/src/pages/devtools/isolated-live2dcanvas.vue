<script setup lang="ts">
import { Live2DCanvas } from '@proj-airi/stage-ui/components/scenes'
import { useSettings } from '@proj-airi/stage-ui/stores/settings'
import { storeToRefs } from 'pinia'
import { Live2DFactory, Live2DModel } from 'pixi-live2d-display/cubism4'
import { onMounted, onUnmounted, ref, watch } from 'vue'

// Import Live2D zip loader utility
import '@proj-airi/stage-ui/utils/live2d-zip-loader'

// Settings store
const settingsStore = useSettings()
const { stageModelSelectedUrl } = storeToRefs(settingsStore)

// Component state
const live2dCanvasRef = ref<InstanceType<typeof Live2DCanvas>>()
const modelUrl = ref('')
const isModelLoaded = ref(false)
const modelStatus = ref<'idle' | 'loading' | 'loaded' | 'error'>('idle')
const currentFps = ref(0)
const modelWidth = ref(0)
const modelHeight = ref(0)
const currentMotion = ref('')
const availableMotions = ref<string[]>([])

// Model transform controls
const modelScale = ref(1)
const modelPosition = ref({ x: 0, y: 0 })
const modelRotation = ref(0)

// PIXI.js size information
const appSize = ref({ width: 0, height: 0 })
const rendererSize = ref({ width: 0, height: 0 })
const canvasSize = ref({ width: 0, height: 0 })
const containerSize = ref({ width: 0, height: 0 })
const stageSize = ref({ width: 0, height: 0 })
const viewportSize = ref({ width: 0, height: 0 })
const resolution = ref(1)
const devicePixelRatio = ref(1)

// PIXI application and model
let app: any = null
let live2dModel: Live2DModel | null = null
let animationFrameId: number | null = null

// Start FPS counter
function startFpsCounter() {
  let lastTime = performance.now()
  let frameCount = 0

  function countFps() {
    frameCount++
    const currentTime = performance.now()

    if (currentTime - lastTime >= 1000) {
      currentFps.value = frameCount
      frameCount = 0
      lastTime = currentTime

      // Update size information every second along with FPS
      updateSizeInfo()
    }

    animationFrameId = requestAnimationFrame(countFps)
  }

  countFps()
}

// Update PIXI.js size information
function updateSizeInfo() {
  if (!app)
    return

  // Application size
  appSize.value = {
    width: app.screen.width,
    height: app.screen.height,
  }

  // Renderer size
  rendererSize.value = {
    width: app.renderer.width,
    height: app.renderer.height,
  }

  // Canvas size (view dimensions)
  canvasSize.value = {
    width: app.view.width,
    height: app.view.height,
  }

  // Container size (canvas element)
  if (live2dCanvasRef.value) {
    const canvas = live2dCanvasRef.value.canvasElement()
    if (canvas) {
      containerSize.value = {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      }
    }
  }

  // Stage size
  stageSize.value = {
    width: app.stage.width,
    height: app.stage.height,
  }

  // Viewport size (renderer viewport)
  viewportSize.value = {
    width: app.renderer.width,
    height: app.renderer.height,
  }

  // Resolution and device pixel ratio
  resolution.value = app.renderer.resolution
  devicePixelRatio.value = window.devicePixelRatio || 1
}

// Load model from settings
function loadModelFromSettings() {
  if (stageModelSelectedUrl.value) {
    modelUrl.value = stageModelSelectedUrl.value
    loadModel()
  }
}

// Load Live2D model
async function loadModel() {
  if (!app || !modelUrl.value)
    return

  try {
    modelStatus.value = 'loading'

    // Clear existing model
    if (live2dModel) {
      app.stage.removeChild(live2dModel)
      live2dModel.destroy()
      live2dModel = null
    }

    // Load new model using Live2DModel.from
    try {
      live2dModel = await Live2DModel.from(modelUrl.value)
    }
    catch (factoryError) {
      console.warn('Live2DModel.from failed, trying Live2DFactory:', factoryError)

      // Fallback to Live2DFactory method
      const modelInstance = new Live2DModel()
      if (modelUrl.value.startsWith('blob:')) {
        const res = await fetch(modelUrl.value)
        const blob = await res.blob()
        await Live2DFactory.setupLive2DModel(modelInstance, [new File([blob], 'model.zip')], { autoInteract: false })
      }
      else {
        await Live2DFactory.setupLive2DModel(modelInstance, modelUrl.value, { autoInteract: false })
      }

      live2dModel = modelInstance
    }

    // Set anchor to center
    live2dModel.anchor.set(0.5, 0.5)

    // Center the model
    live2dModel.x = app.screen.width / 2
    live2dModel.y = app.screen.height / 2

    // Add to stage
    app.stage.addChild(live2dModel)

    // Get model information
    modelWidth.value = live2dModel.width
    modelHeight.value = live2dModel.height

    // Get available motions
    if (live2dModel.internalModel?.motionManager?.definitions) {
      const motions = Object.keys(live2dModel.internalModel.motionManager.definitions)
      availableMotions.value = motions
    }

    // Set initial transform
    updateModelTransform()

    // Update size information after model is loaded
    updateSizeInfo()

    // Start model animation
    live2dModel.on('hit', (_hitAreas) => {
      // Hit areas detected
    })

    isModelLoaded.value = true
    modelStatus.value = 'loaded'
  }
  catch (error) {
    console.error('Failed to load Live2D model:', error)
    modelStatus.value = 'error'
    isModelLoaded.value = false
  }
}

// Clear model
function clearModel() {
  if (!app || !live2dModel)
    return

  app.stage.removeChild(live2dModel)
  live2dModel.destroy()
  live2dModel = null

  isModelLoaded.value = false
  modelStatus.value = 'idle'
  availableMotions.value = []
  currentMotion.value = ''
}

// Update model transform
function updateModelTransform() {
  if (!live2dModel)
    return

  live2dModel.scale.set(modelScale.value)
  live2dModel.x = (app?.screen.width || 800) / 2 + modelPosition.value.x
  live2dModel.y = (app?.screen.height || 600) / 2 + modelPosition.value.y
  live2dModel.rotation = (modelRotation.value * Math.PI) / 180
}

// Play motion
function playMotion(motionName: string) {
  if (!live2dModel)
    return

  try {
    live2dModel.motion(motionName)
    currentMotion.value = motionName
  }
  catch (error) {
    console.error(`Failed to play motion: ${motionName}`, error)
  }
}

// Handle canvas ready
function handleCanvasReady(canvasApp: any) {
  app = canvasApp
  updateSizeInfo()
  startFpsCounter()

  // Auto-load model from settings if available
  if (stageModelSelectedUrl.value) {
    modelUrl.value = stageModelSelectedUrl.value
  }
}

// Watch for settings changes
watch(stageModelSelectedUrl, (newUrl) => {
  if (newUrl && newUrl !== modelUrl.value) {
    modelUrl.value = newUrl
    if (isModelLoaded.value) {
      loadModel()
    }
  }
})

// Lifecycle
onMounted(() => {
  // Add resize listener
  window.addEventListener('resize', updateSizeInfo)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  if (live2dModel) {
    live2dModel.destroy()
  }

  // Remove resize listener
  window.removeEventListener('resize', updateSizeInfo)
})
</script>

<template>
  <div class="live2d-preview-page">
    <div class="header">
      <h1 class="title">
        Live2D Canvas Preview
      </h1>
      <div class="controls">
        <div class="control-group">
          <label>Model URL:</label>
          <input
            v-model="modelUrl"
            type="text"
            placeholder="Enter Live2D model URL or select from settings"
            class="url-input"
          >
          <button class="btn btn-secondary" @click="loadModelFromSettings">
            Load from Settings
          </button>
        </div>
        <div class="control-group">
          <button class="btn btn-primary" :disabled="!modelUrl" @click="loadModel">
            Load Model
          </button>
          <button class="btn btn-danger" :disabled="!isModelLoaded" @click="clearModel">
            Clear Model
          </button>
        </div>
      </div>
    </div>

    <div class="preview-container">
      <Live2DCanvas
        ref="live2dCanvasRef"
        v-slot="{ app: pixiApp }"
        :width="800"
        :height="600"
        :resolution="2"
        class="pixi-container"
      >
        <div v-if="pixiApp" v-show="false" @vue:mounted="handleCanvasReady(pixiApp)" />
        <div v-if="!isModelLoaded" class="placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">
              🎭
            </div>
            <p>No model loaded</p>
            <p class="placeholder-subtitle">
              Enter a Live2D model URL and click "Load Model" to preview
            </p>
          </div>
        </div>
      </Live2DCanvas>

      <div v-if="isModelLoaded" class="model-info">
        <h3>Model Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Status:</span>
            <span class="value" :class="{ success: modelStatus === 'loaded', error: modelStatus === 'error' }">
              {{ modelStatus }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">FPS:</span>
            <span class="value">{{ currentFps.toFixed(1) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Model Size:</span>
            <span class="value">{{ modelWidth }} × {{ modelHeight }}</span>
          </div>
        </div>
      </div>

      <div class="pixi-info">
        <h3>PIXI.js Object Sizes</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Application Size:</span>
            <span class="value">{{ appSize.width }} × {{ appSize.height }}</span>
          </div>
          <div class="info-item">
            <span class="label">Renderer Size:</span>
            <span class="value">{{ rendererSize.width }} × {{ rendererSize.height }}</span>
          </div>
          <div class="info-item">
            <span class="label">Canvas Size:</span>
            <span class="value">{{ canvasSize.width }} × {{ canvasSize.height }}</span>
          </div>
          <div class="info-item">
            <span class="label">Container Size:</span>
            <span class="value">{{ containerSize.width }} × {{ containerSize.height }}</span>
          </div>
          <div class="info-item">
            <span class="label">Stage Size:</span>
            <span class="value">{{ stageSize.width }} × {{ stageSize.height }}</span>
          </div>
          <div class="info-item">
            <span class="label">Viewport Size:</span>
            <span class="value">{{ viewportSize.width }} × {{ viewportSize.height }}</span>
          </div>
          <div class="info-item">
            <span class="label">Resolution:</span>
            <span class="value">{{ resolution.toFixed(2) }}x</span>
          </div>
          <div class="info-item">
            <span class="label">Device Pixel Ratio:</span>
            <span class="value">{{ devicePixelRatio.toFixed(2) }}x</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isModelLoaded" class="interaction-controls">
      <h3>Interaction Controls</h3>
      <div class="controls-grid">
        <div class="control-group">
          <label>Scale:</label>
          <input
            v-model.number="modelScale"
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            @input="updateModelTransform"
          >
          <span class="control-value">{{ modelScale.toFixed(1) }}x</span>
        </div>
        <div class="control-group">
          <label>X Position:</label>
          <input
            v-model.number="modelPosition.x"
            type="range"
            min="-500"
            max="500"
            step="10"
            @input="updateModelTransform"
          >
          <span class="control-value">{{ modelPosition.x }}px</span>
        </div>
        <div class="control-group">
          <label>Y Position:</label>
          <input
            v-model.number="modelPosition.y"
            type="range"
            min="-500"
            max="500"
            step="10"
            @input="updateModelTransform"
          >
          <span class="control-value">{{ modelPosition.y }}px</span>
        </div>
        <div class="control-group">
          <label>Rotation:</label>
          <input
            v-model.number="modelRotation"
            type="range"
            min="-180"
            max="180"
            step="5"
            @input="updateModelTransform"
          >
          <span class="control-value">{{ modelRotation }}°</span>
        </div>
      </div>
    </div>

    <div v-if="isModelLoaded" class="motion-controls">
      <h3>Motion Controls</h3>
      <div class="motion-buttons">
        <button
          v-for="motion in availableMotions"
          :key="motion"
          class="btn btn-motion"
          :class="{ active: currentMotion === motion }"
          @click="playMotion(motion)"
        >
          {{ motion }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live2d-preview-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

.url-input {
  width: 400px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.preview-container {
  position: relative;
  margin-bottom: 30px;
}

.pixi-container {
  width: 800px;
  height: 600px;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f8f9fa;
}

.placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
}

.placeholder-content {
  text-align: center;
  color: #6c757d;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.placeholder-subtitle {
  font-size: 0.9rem;
  margin-top: 8px;
}

.model-info,
.pixi-info {
  margin-top: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.model-info h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 1.2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #555;
}

.info-item .value {
  font-weight: 600;
  color: #333;
}

.info-item .value.success {
  color: #28a745;
}

.info-item .value.error {
  color: #dc3545;
}

.interaction-controls,
.motion-controls {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.interaction-controls h3,
.motion-controls h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 1.2rem;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group input[type="range"] {
  width: 100%;
}

.control-value {
  font-size: 0.9rem;
  color: #666;
  text-align: center;
}

.motion-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.btn-motion {
  background-color: #17a2b8;
  color: white;
  padding: 8px 16px;
  font-size: 0.9rem;
}

.btn-motion:hover {
  background-color: #138496;
}

.btn-motion.active {
  background-color: #28a745;
}

@media (max-width: 768px) {
  .live2d-preview-page {
    padding: 16px;
  }

  .url-input {
    width: 100%;
    max-width: 400px;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .pixi-container {
    width: 100%;
    height: 400px;
  }

  .controls-grid {
    grid-template-columns: 1fr;
  }
}
</style>
