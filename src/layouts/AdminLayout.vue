<template>
  <el-container class="layout-container">
    <el-aside width="230px" class="aside">
      <div class="logo-container">
        <img src="../assets/logo.svg" alt="Logo" class="logo">
        <h1 class="title">实验环境平台</h1>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#409EFF"
        :router="true"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>控制台</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/classes">
          <el-icon><User /></el-icon>
          <span>班级管理</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/tasks">
          <el-icon><Document /></el-icon>
          <span>任务管理</span>
        </el-menu-item>
        
        <el-menu-item index="/admin/tasks/monitor">
          <el-icon><Monitor /></el-icon>
          <span>任务监控</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              {{ userInfo.username }}
              <el-icon><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// 获取用户信息
const userInfo = computed(() => authStore.userInfo || {})

// 计算当前活跃菜单项
const activeMenu = computed(() => {
  return route.meta.activeMenu ? `/admin/${route.meta.activeMenu}` : route.path
})

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    authStore.logout()
  }
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.aside {
  background-color: #001529;
  color: white;
  overflow: hidden;
}

.logo-container {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  background-color: #002140;
}

.logo {
  height: 30px;
  margin-right: 10px;
}

.title {
  color: white;
  font-size: 16px;
  white-space: nowrap;
}

.header {
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
}

.el-menu-vertical {
  border-right: none;
}
</style>