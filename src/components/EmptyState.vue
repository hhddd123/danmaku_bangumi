<template>
  <div class="empty-state" :class="{ 'centered': centered }">
    <v-icon 
      :size="iconSize" 
      :color="iconColor"
      class="empty-icon"
    >
      {{ icon }}
    </v-icon>
    
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="message" class="empty-message">{{ message }}</p>
    
    <div v-if="actions && actions.length > 0" class="empty-actions">
      <v-btn
        v-for="action in actions"
        :key="action.text"
        :color="action.color || 'primary'"
        :variant="action.variant || 'outlined'"
        :size="action.size || 'default'"
        :loading="action.loading"
        :disabled="action.disabled"
        @click="action.handler"
      >
        <v-icon v-if="action.icon" :start="!!action.text">{{ action.icon }}</v-icon>
        {{ action.text }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'mdi-information'
  },
  iconSize: {
    type: [String, Number],
    default: 64
  },
  iconColor: {
    type: String,
    default: 'grey-lighten-1'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  actions: {
    type: Array,
    default: () => []
  },
  centered: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  min-height: 200px;
}

.empty-state.centered {
  min-height: 50vh;
}

.empty-icon {
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-title {
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.empty-message {
  color: #b0b0b0;
  font-size: 1rem;
  margin: 0 0 2rem 0;
  line-height: 1.4;
  max-width: 400px;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.empty-actions .v-btn {
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .empty-state {
    padding: 2rem 1rem;
    min-height: 150px;
  }
  
  .empty-state.centered {
    min-height: 40vh;
  }
  
  .empty-icon {
    font-size: 48px !important;
  }
  
  .empty-title {
    font-size: 1.1rem;
  }
  
  .empty-message {
    font-size: 0.9rem;
  }
  
  .empty-actions {
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .empty-actions {
    flex-direction: column;
    width: 100%;
    max-width: 200px;
  }
  
  .empty-actions .v-btn {
    width: 100%;
  }
}
</style>
