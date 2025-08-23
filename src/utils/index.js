// 防抖函数
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深拷贝
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 格式化时间
export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// 截断文本
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 生成唯一ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 检查是否为移动设备
export function isMobile() {
  return window.innerWidth <= 768
}

// 检查是否为平板设备
export function isTablet() {
  return window.innerWidth > 768 && window.innerWidth <= 1024
}

// 检查是否为桌面设备
export function isDesktop() {
  return window.innerWidth > 1024
}

// 获取设备类型
export function getDeviceType() {
  if (isMobile()) return 'mobile'
  if (isTablet()) return 'tablet'
  return 'desktop'
}

// 本地存储工具
export const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },
  
  clear() {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  }
}

// 错误处理工具
export function handleError(error, defaultMessage = '操作失败') {
  console.error('Error:', error)
  
  if (error.response) {
    // 服务器响应错误
    return error.response.data?.message || `服务器错误: ${error.response.status}`
  } else if (error.request) {
    // 网络错误
    return '网络连接失败，请检查网络设置'
  } else {
    // 其他错误
    return error.message || defaultMessage
  }
}

// 验证工具
export const validators = {
  required(value) {
    return value && value.toString().trim().length > 0
  },
  
  minLength(value, min) {
    return value && value.toString().length >= min
  },
  
  maxLength(value, max) {
    return value && value.toString().length <= max
  },
  
  email(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },
  
  url(value) {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }
}

// 数组工具
export const arrayUtils = {
  // 分页
  paginate(array, page, itemsPerPage) {
    const start = (page - 1) * itemsPerPage
    const end = start + itemsPerPage
    return array.slice(start, end)
  },
  
  // 去重
  unique(array, key) {
    if (key) {
      const seen = new Set()
      return array.filter(item => {
        const value = item[key]
        if (seen.has(value)) {
          return false
        }
        seen.add(value)
        return true
      })
    }
    return [...new Set(array)]
  },
  
  // 排序
  sort(array, key, order = 'asc') {
    return array.sort((a, b) => {
      const aVal = key ? a[key] : a
      const bVal = key ? b[key] : b
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })
  }
}
