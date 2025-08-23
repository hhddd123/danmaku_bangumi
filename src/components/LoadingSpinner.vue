<template>
  <div class="loading-container" :class="{ 'fullscreen': fullscreen }">
    <v-progress-circular
      :size="size"
      :width="width"
      :color="color"
      indeterminate
      class="loading-spinner"
    ></v-progress-circular>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: [String, Number],
    default: 48
  },
  width: {
    type: [String, Number],
    default: 4
  },
  color: {
    type: String,
    default: 'primary'
  },
  text: {
    type: String,
    default: ''
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.loading-text {
  color: #b0b0b0;
  font-size: 1rem;
  margin: 0;
  font-weight: 400;
}

.loading-container.fullscreen .loading-text {
  color: #ffffff;
}
</style>
