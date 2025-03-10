<template>
  <div class="not-found-container">
    <el-result
      icon="warning"
      title="404"
      sub-title="抱歉，您访问的页面不存在"
    >
      <template #extra>
        <el-button type="primary" @click="goHome">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 根据用户角色返回相应的首页
const goHome = () => {
  if (authStore.isLoggedIn) {
    if (authStore.isAdmin) {
      router.push('/admin/dashboard')
    } else if (authStore.isStudent) {
      router.push('/student/dashboard')
    } else {
      router.push('/')
    }
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>