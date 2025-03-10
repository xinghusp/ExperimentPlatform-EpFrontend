<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <img src="../../assets/logo.svg" alt="Logo" class="login-logo">
        <h2>实验环境平台-学生登录</h2>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="学号" prop="student_id">
          <el-input 
            v-model="loginForm.student_id"
            placeholder="请输入学号"
            prefix-icon="UserFilled"
          />
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input 
            v-model="loginForm.name"
            placeholder="请输入姓名"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            native-type="submit" 
            :loading="loading"
            class="submit-btn"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <el-link type="primary" href="/admin/login">管理员登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const loginFormRef = ref(null)

const loginForm = reactive({
  student_id: '',
  name: ''
})

const loginRules = {
  student_id: [
    { required: true, message: '请输入学号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        
        // 调用auth store的登录方法
        await authStore.login(loginForm, 'student')
        
        ElMessage.success('登录成功')
      } catch (error) {
        console.error(error)
        ElMessage.error('登录失败，请检查学号和姓名')
      } finally {
        loading.value = false
      }
    }
  })
}

// 检查是否已经登录，如果是则直接跳转
onMounted(() => {
  if (authStore.isLoggedIn && authStore.isStudent) {
    router.push('/student/dashboard')
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