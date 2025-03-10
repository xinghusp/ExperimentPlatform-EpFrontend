<template>
  <div class="class-edit-container">
    <div class="page-header">
      <h2>编辑班级</h2>
      <el-button @click="backToList">返回列表</el-button>
    </div>
    
    <el-card v-loading="loading">
      <el-form
        v-if="!loading"
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
          <el-button type="primary" :loading="submitting" @click="submitForm">保存修改</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getClass, updateClass } from '../../../api/class'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const classId = parseInt(route.params.id)
const classFormRef = ref(null)
const submitting = ref(false)
const loading = ref(true)

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

// 获取班级信息
async function fetchClassData() {
  try {
    loading.value = true
    const res = await getClass(classId)
    
    // 更新表单数据
    classForm.name = res.name
    classForm.description = res.description || ''
  } catch (error) {
    console.error('获取班级信息失败:', error)
    ElMessage.error('获取班级信息失败')
    router.push('/admin/classes')
  } finally {
    loading.value = false
  }
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
        
        await updateClass(classId, classForm)
        
        ElMessage.success('班级修改成功')
        router.push('/admin/classes')
      } catch (error) {
        console.error('修改班级失败:', error)
        ElMessage.error('修改班级失败')
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.warning('请完善表单信息')
      return false
    }
  })
}

onMounted(() => {
  fetchClassData()
})
</script>

<style scoped>
.class-edit-container {
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