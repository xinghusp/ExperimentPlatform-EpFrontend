<template>
  <div class="task-list-container">
    <div class="page-header">
      <h2>任务管理</h2>
      <el-button type="primary" @click="handleCreateTask">
        新建任务
      </el-button>
    </div>

    <el-card>
      <el-table :data="taskList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="任务标题" />
        <el-table-column label="时长/次数" width="120">
          <template #default="scope">
            {{ scope.row.max_duration ? `${scope.row.max_duration}分钟` : '不限时' }} / {{ scope.row.max_attempts }}次
          </template>
        </el-table-column>
        <el-table-column prop="region_id" label="区域" width="120" />
        <el-table-column prop="instance_type" label="实例类型" width="180" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="班级" width="120">
          <template #default="scope">
            <el-popover placement="top" trigger="hover" :width="200">
              <template #default>
                <div v-if="scope.row.classes && scope.row.classes.length > 0">
                  <div v-for="cls in scope.row.classes" :key="cls.id" class="class-item">
                    {{ cls.name }}
                  </div>
                </div>
                <div v-else>
                  无关联班级
                </div>
              </template>
              <template #reference>
                <el-tag type="info">{{ scope.row.classes ? scope.row.classes.length : 0 }}个班级</el-tag>
              </template>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <!-- <el-button 
              type="primary" 
              size="small"
              @click="handleViewTask(scope.row)"
            >
              查看
            </el-button> -->
            <el-button type="warning" size="small" @click="handleEditTask(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteTask(scope.row)">
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
import { getTasks, deleteTask } from '../../../api/task'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const taskList = ref([])

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取任务列表
const fetchTaskList = async () => {
  try {
    loading.value = true
    const res = await getTasks()
    taskList.value = res
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 查看任务
const handleViewTask = (row) => {
  router.push(`/admin/tasks/${row.id}`)
}

// 编辑任务
const handleEditTask = (row) => {
  router.push(`/admin/tasks/${row.id}`)
}

// 新建任务
const handleCreateTask = () => {
  router.push('/admin/tasks/create')
}

// 删除任务
const handleDeleteTask = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务 "${row.title}" 吗？此操作将同时删除所有相关的学生任务记录，且不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteTask(row.id)
    ElMessage.success('删除成功')

    // 刷新列表
    fetchTaskList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchTaskList()
})
</script>

<style scoped>
.task-list-container {
  padding: 10px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.class-item {
  margin-bottom: 8px;
}
</style>