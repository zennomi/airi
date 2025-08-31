import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTrainingPointsStore = defineStore('training-points', () => {
  // State
  const trainingPoints = useLocalStorage('training-points', 0)
  const pointUpdating = ref(false)
  const lastHitTime = ref(0)
  const showPointsEarned = ref(false)
  const pointsEarnedAnimation = ref(0)

  // Constants
  const HIT_COOLDOWN = 1000 // 1 second cooldown to prevent spam

  // Actions
  function handlePointUpdateEvent() {
    const now = Date.now()

    // Check if enough time has passed since last hit (anti-spam)
    if (now - lastHitTime.value < HIT_COOLDOWN) {
      return false
    }

    // Check if motion is not currently playing
    if (pointUpdating.value) {
      return false
    }

    pointUpdating.value = true

    // Increase training points
    trainingPoints.value++
    lastHitTime.value = now

    // Show visual feedback
    showPointsEarned.value = true
    pointsEarnedAnimation.value = trainingPoints.value

    // Hide the feedback after 2 seconds
    setTimeout(() => {
      showPointsEarned.value = false
    }, 2000)

    console.warn(`Training points increased! Current points: ${trainingPoints.value}`)
    return true
  }

  function setPointUpdating(playing: boolean) {
    pointUpdating.value = playing
  }

  function resetTrainingPoints() {
    trainingPoints.value = 0
    console.warn('Training points reset to 0')
  }

  return {
    // State
    trainingPoints,
    pointUpdating,
    lastHitTime,
    showPointsEarned,
    pointsEarnedAnimation,

    // Constants
    HIT_COOLDOWN,

    // Actions
    handlePointUpdateEvent,
    setPointUpdating,
    resetTrainingPoints,
  }
})
