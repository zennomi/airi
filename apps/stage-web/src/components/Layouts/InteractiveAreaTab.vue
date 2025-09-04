<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  themeColorsHueDynamic: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const tab = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

const TABS = [
  {
    value: 'chat',
    label: 'Chat',
    icon: 'i-solar:dialog-2-bold-duotone',
  },
  {
    value: 'appearance',
    label: 'Appearance',
    icon: 'i-solar:hanger-2-bold-duotone',
  },
]
</script>

<template>
  <fieldset flex="~ row" w-fit gap-2 rounded-lg>
    <template v-for="tabItem in TABS" :key="tabItem.value">
      <label
        :class="[
          tab === tabItem.value ? 'bg-primary-100 dark:bg-primary-900' : 'bg-white dark:bg-primary-950',
          tab === tabItem.value ? 'text-primary-500 dark:text-primary-500' : '',
          { 'transition-colors-none ': themeColorsHueDynamic },
        ]"
        flex="~ row"
        :checked="tab === tabItem.value"
        :aria-checked="tab === tabItem.value"
        border="solid 2 primary-100 dark:primary-900"
        text="primary-300 hover:primary-500 dark:primary-300/50 dark:hover:primary-500"
        transition="all duration-250 ease-in-out"
        cursor-pointer
        items-center gap-1 rounded-lg px-2 @click="tab = tabItem.value"
      >
        <input v-model="tab" type="radio" name="tab" :value="tabItem.value" hidden>
        <div :class="tabItem.icon" text="2xl" transform="translate-y--2" />
        <div flex="~ row" items-center>
          <span min-w="3em">{{ tabItem.label }}</span>
        </div>
      </label>
    </template>
  </fieldset>
</template>
