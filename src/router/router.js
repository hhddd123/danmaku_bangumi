import { createRouter, createWebHashHistory } from "vue-router";
import { useSearchStore } from '@/stores/searchVideo'
import { ROUTES, PAGE_TITLES } from '@/constants'
import searchPage from "@/views/searchPage.vue";
import animeListPage from "@/views/animeListPage.vue";
import animeDetialPage from "@/views/animeDetialPage.vue";
import playerPage from "@/views/playerPage.vue";

const routes = [
    { 
        path: '/', 
        redirect: '/search' 
    },
    { 
        path: '/search', 
        name: ROUTES.SEARCH, 
        component: searchPage,
        meta: {
            title: PAGE_TITLES[ROUTES.SEARCH],
            requiresAuth: false
        }
    },
    { 
        path: '/list', 
        name: ROUTES.LIST, 
        component: animeListPage,
        meta: {
            title: PAGE_TITLES[ROUTES.LIST],
            requiresAuth: false,
            requiresSearchData: true
        }
    },
    { 
        path: '/detail', 
        name: ROUTES.DETAIL, 
        component: animeDetialPage,
        meta: {
            title: PAGE_TITLES[ROUTES.DETAIL],
            requiresAuth: false,
            requiresVideoSelection: true
        }
    },
    { 
        path: '/player', 
        name: ROUTES.PLAYER, 
        component: playerPage,
        meta: {
            title: PAGE_TITLES[ROUTES.PLAYER],
            requiresAuth: false,
            requiresVideoSelection: true
        }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const searchStore = useSearchStore()
    
    // 设置页面标题
    if (to.meta.title) {
        document.title = `${to.meta.title} - 弹幕动漫`
    }
    
    // 更新路径名称
    searchStore.setPathName(to.name)
    
    // 检查是否需要搜索数据
    if (to.meta.requiresSearchData && !searchStore.hasSearchResults) {
        next('/search')
        return
    }
    
    // 检查是否需要视频选择
    if (to.meta.requiresVideoSelection && !searchStore.currentVideo) {
        next('/list')
        return
    }
    
    next()
})

// 路由后置守卫
router.afterEach((to, from) => {
    // 可以在这里添加页面访问统计等逻辑
    console.log(`Navigated from ${from.name} to ${to.name}`)
})

export default router