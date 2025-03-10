<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <img src="../../assets/logo.svg" alt="Logo" class="login-logo">
        <h2>实验环境平台-管理员登录</h2>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="top"
        @submit.prevent="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" class="submit-btn">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-link type="primary" href="/student/login">学生登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const loginForm = reactive({
  username: '',
  password: ''
})
const loginFormRef = ref(null);

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}


const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true

        // 调用auth store的登录方法
        await authStore.login({
          username: loginForm.username,
          password: loginForm.password
        }, 'admin')

        ElMessage.success('登录成功')
      } catch (error) {
        console.error(error)
        ElMessage.error('登录失败，请检查用户名和密码')
      } finally {
        loading.value = false
      }
    }
  })
}

// 检查是否已经登录，如果是则直接跳转
onMounted(() => {
  if (authStore.isLoggedIn && authStore.isAdmin) {
    router.push('/admin/dashboard')
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 380px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-logo {
  width: 70px;
  margin-bottom: 10px;
}

.submit-btn {
  width: 100%;
}

.login-footer {
  margin-top: 16px;
  text-align: center;
}
</style>