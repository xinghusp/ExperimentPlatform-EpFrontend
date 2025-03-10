<template>
  <div class="class-list-container">
    <div class="page-header">
      <h2>班级管理</h2>
      <el-button type="primary" @click="handleCreateClass">
        新增班级
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="classList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="班级名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="student_count" label="学生数" />
        <el-table-column prop="created_at" label="创建时间">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small"
              @click="handleViewStudents(scope.row)"
            >
              学生列表
            </el-button>
            <el-button 
              type="warning" 
              size="small"
              @click="handleEditClass(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small"
              @click="handleDeleteClass(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getClasses, deleteClass } from '../../../api/class'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const classList = ref([])

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取班级列表
const fetchClasses = async () => {
  try {
    loading.value = true
    const res = await getClasses()
    classList.value = res
  } catch (error) {
    console.error('获取班级列表失败:', error)
    ElMessage.error('获取班级列表失败')
  } finally {
    loading.value = false
  }
}

// 查看班级学生
const handleViewStudents = (row) => {
  router.push(`/admin/classes/${row.id}/students`)
}

// 编辑班级
const handleEditClass = (row) => {
  router.push(`/admin/classes/${row.id}`)
}

// 新增班级
const handleCreateClass = () => {
  router.push('/admin/classes/create')
}

// 删除班级
const handleDeleteClass = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除班级 "${row.name}" 吗？此操作将同时删除该班级下的所有学生数据，且不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteClass(row.id)
    ElMessage.success('删除成功')
    
    // 刷新列表
    fetchClasses()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchClasses()
})
</script>

<style scoped>
.class-list-container {
  padding: 10px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>