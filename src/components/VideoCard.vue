<template>
  <v-card
    class="video-card"
    :elevation="elevation"
    :rounded="rounded"
    :hover="hover"
    @click="handleClick"
  >
    <div class="image-container">
      <v-img
        :src="imageUrl"
        :alt="title"
        :cover="cover"
        class="video-image"
        :loading="imageLoading ? 'lazy' : 'eager'"
      >
        <template v-slot:placeholder>
          <div class="image-placeholder">
            <v-icon size="48" color="grey-lighten-1">mdi-image</v-icon>
          </div>
        </template>
        
        <div v-if="showOverlay" class="image-overlay">
          <v-icon :color="overlayIconColor" :size="overlayIconSize">
            {{ overlayIcon }}
          </v-icon>
        </div>
        
        <div v-if="badge" class="image-badge">
          <v-chip
            :color="badge.color"
            :size="badge.size || 'small'"
            :variant="badge.variant || 'elevated'"
          >
            {{ badge.text }}
          </v-chip>
        </div>
      </v-img>
    </div>
    
    <v-card-text v-if="showContent" class="video-content">
      <h3 class="video-title" :title="title">{{ title }}</h3>
      <p v-if="subtitle" class="video-subtitle">{{ subtitle }}</p>
      <div v-if="tags && tags.length > 0" class="video-tags">
        <v-chip
          v-for="tag in tags"
          :key="tag"
          size="x-small"
          variant="outlined"
          class="tag-chip"
        >
          {{ tag }}
        </v-chip>
      </div>
    </v-card-text>
    
    <v-card-actions v-if="actions && actions.length > 0" class="video-actions">
      <v-btn
        v-for="action in actions"
        :key="action.text"
        :color="action.color || 'primary'"
        :variant="action.variant || 'text'"
        :size="action.size || 'small'"
        :loading="action.loading"
        :disabled="action.disabled"
        @click.stop="action.handler"
      >
        <v-icon v-if="action.icon" :start="!!action.text">{{ action.icon }}</v-icon>
        {{ action.text }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({
  // 基础属性
  imageUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  
  // 卡片属性
  elevation: {
    type: [String, Number],
    default: 4
  },
  rounded: {
    type: [String, Boolean],
    default: 'lg'
  },
  hover: {
    type: Boolean,
    default: true
  },
  
  // 图片属性
  cover: {
    type: Boolean,
    default: true
  },
  imageLoading: {
    type: Boolean,
    default: true
  },
  
  // 覆盖层属性
  showOverlay: {
    type: Boolean,
    default: false
  },
  overlayIcon: {
    type: String,
    default: 'mdi-play'
  },
  overlayIconColor: {
    type: String,
    default: 'white'
  },
  overlayIconSize: {
    type: [String, Number],
    default: 32
  },
  
  // 徽章属性
  badge: {
    type: Object,
    default: null
  },
  
  // 内容属性
  showContent: {
    type: Boolean,
    default: true
  },
  tags: {
    type: Array,
    default: () => []
  },
  
  // 操作按钮
  actions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.video-card {
  background: rgba(60, 60, 60, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(100, 181, 246, 0.3);
}

.image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.video-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.video-card:hover .video-image {
  transform: scale(1.05);
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgba(80, 80, 80, 0.5);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .image-overlay {
  opacity: 1;
}

.image-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.video-content {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.video-title {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-subtitle {
  color: #b0b0b0;
  font-size: 0.8rem;
  margin: 0 0 0.75rem 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: auto;
}

.tag-chip {
  font-size: 0.7rem;
  height: 20px;
}

.video-actions {
  padding: 0.5rem 1rem 1rem;
  background: rgba(30, 30, 30, 0.5);
}

.video-actions .v-btn {
  text-transform: none;
  font-weight: 500;
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-container {
    height: 150px;
  }
  
  .video-title {
    font-size: 0.8rem;
  }
  
  .video-subtitle {
    font-size: 0.75rem;
  }
  
  .video-content {
    padding: 0.75rem;
  }
  
  .video-actions {
    padding: 0.5rem 0.75rem 0.75rem;
  }
}

@media (max-width: 480px) {
  .image-container {
    height: 120px;
  }
  
  .video-title {
    font-size: 0.75rem;
  }
  
  .video-subtitle {
    font-size: 0.7rem;
  }
  
  .video-content {
    padding: 0.5rem;
  }
  
  .video-actions {
    padding: 0.25rem 0.5rem 0.5rem;
  }
}
</style>
