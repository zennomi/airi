<script setup lang="ts">
import { useCharacterStore } from '@proj-airi/stage-ui/stores/character'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const characterStore = useCharacterStore()
const { appearanceState, character } = storeToRefs(characterStore)

// Array-based icon configuration for appearances
const appearanceIconConfigs = [
  { key: 'glass', on: 'i-solar:glasses-bold-duotone', off: 'i-solar:glasses-outline' },
  { key: 'jacket', on: 'i-solar:t-shirt-bold-duotone', off: 'i-solar:t-shirt-outline' },
]

// Default icons when a specific key is not configured above
const defaultAppearanceIcons = { on: 'i-solar:palette-bold-duotone', off: 'i-solar:palette-outline' }

function getAppearanceIconClass(appearanceKey: string, isEnabled: boolean): string {
  const config = appearanceIconConfigs.find(c => c.key === appearanceKey)
  const icon = config ? (isEnabled ? config.on : config.off) : (isEnabled ? defaultAppearanceIcons.on : defaultAppearanceIcons.off)
  return `text-xl ${icon}`
}

// Computed property to get available appearances
const availableAppearances = computed(() => {
  if (!character.value)
    return []

  return Object.entries(character.value.appearances).map(([key, appearance]) => ({
    key,
    ...appearance,
  }))
})

// Function to handle appearance toggle
function toggleAppearance(appearanceKey: string) {
  const currentState = appearanceState.value[appearanceKey]
  characterStore.updateAppearanceState(appearanceKey, !currentState)
}
</script>

<template>
  <div class="appearance-tab-content">
    <!-- Header -->
    <div class="mb-6">
      <h3 class="mb-2 text-lg text-neutral-800 font-semibold dark:text-neutral-200">
        Appearance Settings
      </h3>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Toggle different appearance elements for your character
      </p>
    </div>

    <!-- Appearance Controls -->
    <div v-if="availableAppearances.length > 0" class="space-y-3">
      <div
        v-for="appearance in availableAppearances"
        :key="appearance.key"
        class="appearance-toggle-item"
      >
        <label
          class="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 transition-all duration-250 ease-in-out"
          :class="[
            appearanceState[appearance.key]
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-900'
              : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700',
            'border-2 hover:border-primary-500/30 dark:hover:border-primary-400/30',
          ]"
          @click="toggleAppearance(appearance.key)"
        >
          <div class="flex items-center gap-3">
            <!-- Icon based on appearance type -->
            <div
              class="h-10 w-10 flex items-center justify-center rounded-lg transition-colors duration-200"
              :class="[
                appearanceState[appearance.key]
                  ? 'bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-400'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400',
              ]"
            >
              <div :class="getAppearanceIconClass(appearance.key, appearanceState[appearance.key])" />
            </div>

            <!-- Appearance Info -->
            <div class="flex flex-col">
              <span
                class="font-medium transition-colors duration-200"
                :class="[
                  appearanceState[appearance.key]
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-neutral-700 dark:text-neutral-300',
                ]"
              >
                {{ appearance.expression }}
              </span>
              <span class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ appearance.key }}
              </span>
            </div>
          </div>

          <!-- Toggle Switch -->
          <div class="relative">
            <input
              :checked="appearanceState[appearance.key]"
              type="checkbox"
              class="sr-only"
              @change="toggleAppearance(appearance.key)"
            >
            <div
              class="toggle-switch h-6 w-11 rounded-full transition-colors duration-200"
              :class="[
                appearanceState[appearance.key]
                  ? 'bg-primary-500 dark:bg-primary-400'
                  : 'bg-neutral-300 dark:bg-neutral-600',
              ]"
            >
              <div
                class="toggle-knob absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200"
                :class="[
                  appearanceState[appearance.key] ? 'translate-x-5' : 'translate-x-0.5',
                ]"
              />
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-8 text-center">
      <div class="i-solar:palette-outline mb-3 text-4xl text-neutral-400 dark:text-neutral-500" />
      <p class="text-neutral-600 dark:text-neutral-400">
        No appearance options available for the current character
      </p>
    </div>
  </div>
</template>

<style scoped>
.appearance-tab-content {
  @apply p-4;
}

.appearance-toggle-item {
  @apply transition-all duration-200 ease-in-out;
}

.appearance-toggle-item:hover {
  @apply transform scale-[1.02];
}

.toggle-switch {
  @apply relative cursor-pointer;
}

.toggle-knob {
  @apply flex items-center justify-center;
}

/* Smooth transitions for all interactive elements */
.appearance-toggle-item * {
  @apply transition-all duration-200 ease-in-out;
}
</style>
