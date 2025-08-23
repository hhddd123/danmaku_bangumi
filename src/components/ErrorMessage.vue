<template>
  <v-alert
    v-if="show"
    :type="type"
    :variant="variant"
    :closable="closable"
    :density="density"
    class="error-message"
    @click:close="handleClose"
  >
    <template v-if="icon" v-slot:prepend>
      <v-icon :color="type">{{ icon }}</v-icon>
    </template>
    
    <div class="error-content">
      <h4 v-if="title" class="error-title">{{ title }}</h4>
      <p class="error-text">{{ message }}</p>
      <div v-if="actions && actions.length > 0" class="error-actions">
        <v-btn
          v-for="action in actions"
          :key="action.text"
          :color="action.color || 'primary'"
          :variant="action.variant || 'text'"
          :size="action.size || 'small'"
          @click="action.handler"
        >
          {{ action.text }}
        </v-btn>
      </div>
    </div>
  </v-alert>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'error',
    validator: (value) => ['error', 'warning', 'info', 'success'].includes(value)
  },
  variant: {
    type: String,
    default: 'tonal'
  },
  closable: {
    type: Boolean,
    default: true
  },
  density: {
    type: String,
    default: 'comfortable'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  actions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const icon = computed(() => {
  const iconMap = {
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
    success: 'mdi-check-circle'
  }
  return iconMap[props.type]
})

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.error-message {
  margin: 1rem 0;
  border-radius: 8px;
}

.error-content {
  width: 100%;
}

.error-title {
  color: inherit;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.error-text {
  color: inherit;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.error-actions .v-btn {
  text-transform: none;
  font-weight: 500;
}
</style>
