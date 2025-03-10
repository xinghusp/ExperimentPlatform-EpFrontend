import { createRouter, createWebHistory } from 'vue-router'
import adminRoutes from './admin'
import studentRoutes from './student'

const routes = [
  {
    path: '/',
    redirect: '/admin/login'
  },
  {
    path: '/admin/login',
    component: () => import('../views/auth/AdminLogin.vue'),
    meta: { requiresAuth: false, title: '管理员登录' }
  },
  {
    path: '/student/login',
    component: () => import('../views/auth/StudentLogin.vue'),
    meta: { requiresAuth: false, title: '学生登录' }
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: adminRoutes
  },
  {
    path: '/student',
    component: () => import('../layouts/StudentLayout.vue'),
    meta: { requiresAuth: true, role: 'student' },
    children: studentRoutes
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 更新页面标题
  document.title = to.meta.title ? `${to.meta.title} - 实验环境平台` : '实验环境平台'
  
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{"role":""}')
  const token = localStorage.getItem('token')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // 如果需要认证但没有token，重定向到登录页
  if (requiresAuth && !token) {
    next('/admin/login')
    return
  }
  
  // 如果路由有角色要求，检查用户角色
  if (to.meta.role && to.meta.role !== userInfo.role) {
    next(userInfo.role === 'admin' ? '/admin' : '/student')
    return
  }
  
  next()
})

export default router