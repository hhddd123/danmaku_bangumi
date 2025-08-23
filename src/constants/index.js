// 网站配置
export const WEBSITES = {
  YINGHUA: 'yinghua',
  LIANGZI: 'liangzi',
  UKU: 'uku',
  WOLONG: 'wolong',
  FEIFAN: 'feifan'
}

// 网站信息
export const WEBSITE_INFO = {
  [WEBSITES.YINGHUA]: {
    name: '樱花动漫',
    icon: 'mdi-sakura',
    color: '#ff6b9d'
  },
  [WEBSITES.LIANGZI]: {
    name: '量子资源',
    icon: 'mdi-atom',
    color: '#4caf50'
  },
  [WEBSITES.UKU]: {
    name: '优酷',
    icon: 'mdi-play-circle',
    color: '#ff9800'
  },
  [WEBSITES.WOLONG]: {
    name: '卧龙',
    icon: 'mdi-dragon',
    color: '#9c27b0'
  },
  [WEBSITES.FEIFAN]: {
    name: '非凡',
    icon: 'mdi-star',
    color: '#2196f3'
  }
}

// 路由配置
export const ROUTES = {
  SEARCH: 'search',
  LIST: 'list',
  DETAIL: 'detail',
  PLAYER: 'player'
}

// 页面标题
export const PAGE_TITLES = {
  [ROUTES.SEARCH]: '动漫搜索',
  [ROUTES.LIST]: '搜索结果',
  [ROUTES.DETAIL]: '动漫详情',
  [ROUTES.PLAYER]: '视频播放'
}

// 分页配置
export const PAGINATION = {
  ITEMS_PER_PAGE: 12,
  MAX_VISIBLE_PAGES: 7,
  MOBILE_MAX_VISIBLE_PAGES: 5
}

// 动画配置
export const ANIMATION = {
  PAGE_TRANSITION_DURATION: 400,
  CARD_HOVER_DURATION: 300,
  LOADING_DURATION: 600
}

// 主题配置
export const THEME = {
  COLORS: {
    PRIMARY: '#64b5f6',
    SECONDARY: '#b0b0b0',
    BACKGROUND: '#1a1a1a',
    SURFACE: '#2d2d2d',
    CARD: 'rgba(45, 45, 45, 0.8)',
    BORDER: 'rgba(255, 255, 255, 0.1)'
  },
  GRADIENTS: {
    MAIN: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
  }
}

// 错误消息
export const ERROR_MESSAGES = {
  SEARCH_FAILED: '搜索失败，请稍后重试',
  NO_RESULTS: '未找到相关结果',
  NETWORK_ERROR: '网络连接失败',
  LOADING_FAILED: '加载失败，请稍后重试',
  INVALID_KEYWORD: '请输入有效的搜索关键词'
}

// 成功消息
export const SUCCESS_MESSAGES = {
  SEARCH_SUCCESS: '搜索完成',
  DANMAKU_LOADED: '弹幕加载成功',
  VIDEO_LOADED: '视频加载成功'
}
