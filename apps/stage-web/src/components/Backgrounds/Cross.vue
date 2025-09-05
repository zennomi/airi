<template>
  <div class="cross-background-container">
    <slot />
  </div>
</template>

<style lang="css" scoped>
.cross-background-container {
  background-color: #ffffff;
  position: relative;
}

.cross-background-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('./hust.png');
  background-repeat: repeat;
  background-size: 100px auto;
  background-blend-mode: normal;
  opacity: 0.1;
  pointer-events: none;
  z-index: 0;
}

.cross-background-container>* {
  position: relative;
  z-index: 1;
}

.dark .cross-background-container {
  background-color: #121212;
}

.dark .cross-background-container::before {
  background-image: url('./hust.png');
}
</style>
