<template>
  <el-container class="layout-container">
    <el-header class="header">
      <div class="header-left">
        <div class="logo-container">
          <img src="../assets/logo.svg" alt="Logo" class="logo">
          <h1 class="title">实验环境平台</h1>
        </div>
      </div>
      
      <div class="header-center">
        <el-menu
          :default-active="route.path"
          class="el-menu-horizontal"
          mode="horizontal"
          :router="true"
        >
          <el-menu-item index="/student/dashboard">我的实验</el-menu-item>
        </el-menu>
      </div>
      
      <div class="header-right">
        <el-dropdown @command="handleCommand">
          <span class="user-dropdown">
            {{ userInfo.name || userInfo.username }}
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
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// 获取用户信息
const userInfo = computed(() => authStore.userInfo || {})

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

.header {
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.logo-container {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}

.logo {
  height: 30px;
  margin-right: 10px;
}

.title {
  color: #001529;
  font-size: 18px;
  white-space: nowrap;
}

.header-center {
  flex: 1;
}

.header-right {
  padding: 0 20px;
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

.el-menu-horizontal {
  border-bottom: none;
}
</style>