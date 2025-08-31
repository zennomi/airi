<script setup lang="ts">
import { IconItem } from '@proj-airi/stage-ui/components'

const devtools = [
  {
    title: 'Isolated Live2D Model',
    description: 'Preview Live2D models with PIXI.js and manual model loading',
    icon: 'i-solar:people-nearby-bold-duotone',
    to: '/devtools/isolated-live2d',
  },
  {
    title: 'Isolated Live2D Canvas',
    description: 'Preview Live2D models using Live2DCanvas component',
    icon: 'i-solar:people-nearby-bold-duotone',
    to: '/devtools/isolated-live2dcanvas',
  },
  {
    title: 'Polaroid',
    description: 'Live2D model capture and motion controls',
    icon: 'i-solar:camera-bold-duotone',
    to: '/devtools/polaroid',
  },
  {
    title: 'Chat',
    description: 'Chat interface testing and development',
    icon: 'i-solar:chat-round-dots-bold-duotone',
    to: '/devtools/chat',
  },
  {
    title: 'Gesture Circle',
    description: 'Gesture recognition and circle interactions',
    icon: 'i-solar:mouse-bold-duotone',
    to: '/devtools/gesture-circle',
  },
  {
    title: 'Image',
    description: 'Image processing and manipulation tools',
    icon: 'i-solar:camera-square-bold-duotone',
    to: '/devtools/image',
  },
  {
    title: 'Vibrant',
    description: 'Color palette and vibrant color tools',
    icon: 'i-solar:pallete-2-bold-duotone',
    to: '/devtools/vibrant',
  },
  {
    title: 'Audio Record',
    description: 'Audio recording and input testing',
    icon: 'i-solar:microphone-3-bold-duotone',
    to: '/devtools/audio-record',
  },
  {
    title: 'Background Gradient Blending',
    description: 'Background gradient and blending effects',
    icon: 'i-solar:pallete-2-bold-duotone',
    to: '/devtools/background-gradient-blending',
  },
  {
    title: 'Background Remove',
    description: 'Background removal and processing tools',
    icon: 'i-solar:notification-remove-bold-duotone',
    to: '/devtools/background-remove',
  },
]
</script>

<template>
  <div class="devtools-index-page">
    <div class="header">
      <h1 class="title">
        Development Tools
      </h1>
      <p class="subtitle">
        Collection of development and testing tools for AIRI
      </p>
    </div>

    <div class="tools-grid">
      <IconItem
        v-for="(tool, index) in devtools"
        :key="tool.to"
        v-motion
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0 }"
        :duration="250"
        :style="{
          transitionDelay: `${index * 50}ms`,
        }"
        :title="tool.title"
        :description="tool.description"
        :icon="tool.icon"
        :to="tool.to"
      />
    </div>

    <div
      v-motion
      text="neutral-200/50 dark:neutral-600/20"
      pointer-events-none
      fixed
      top="[calc(100dvh-12rem)]"
      bottom-0
      right--10
      z--1
      :initial="{ scale: 0.9, opacity: 0, rotate: 180 }"
      :enter="{ scale: 1, opacity: 1, rotate: 0 }"
      :duration="500"
      size-60
      flex
      items-center
      justify-center
    >
      <div text="60" i-solar:code-bold-duotone />
    </div>
  </div>
</template>

<style scoped>
.devtools-index-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .devtools-index-page {
    padding: 16px;
  }

  .title {
    font-size: 2rem;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<route lang="yaml">
meta:
  layout: default
</route>
