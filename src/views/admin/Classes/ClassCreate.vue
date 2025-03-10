<template>
  <div class="class-create-container">
    <div class="page-header">
      <h2>创建班级</h2>
      <el-button @click="backToList">返回列表</el-button>
    </div>
    
    <el-card>
      <el-form
        ref="classFormRef"
        :model="classForm"
        :rules="classRules"
        label-width="120px"
        label-position="right"
      >
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="classForm.name" placeholder="请输入班级名称" />
        </el-form-item>
        
        <el-form-item label="班级描述" prop="description">
          <el-input
            v-model="classForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入班级描述"
          />
        </el-form-item>
        
        <div class="form-actions">
          <el-button @click="backToList">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">创建班级</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createClass } from '../../../api/class'
import { ElMessage } from 'element-plus'

const router = useRouter()
const classFormRef = ref(null)
const submitting = ref(false)

const classForm = reactive({
  name: '',
  description: ''
})

const classRules = {
  name: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 返回列表页
function backToList() {
  router.push('/admin/classes')
}

// 提交表单
async function submitForm() {
  if (!classFormRef.value) return
  
  await classFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true
        
        await createClass(classForm)
        
        ElMessage.success('班级创建成功')
        router.push('/admin/classes')
      } catch (error) {
        console.error('创建班级失败:', error)
        ElMessage.error('创建班级失败')
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.warning('请完善表单信息')
      return false
    }
  })
}
</script>

<style scoped>
.class-create-container {
  padding: 10px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-actions {
  margin-top: 30px;
  text-align: right;
}
</style>