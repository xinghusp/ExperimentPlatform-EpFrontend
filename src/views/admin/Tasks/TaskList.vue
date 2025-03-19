<template>
  <div class="task-list-container">
    <div class="page-header">
      <h2>任务管理</h2>
      <el-button type="primary" @click="handleCreateTask">
        新建任务
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" @submit.prevent="applyFilter">
        <el-form-item label="任务类型" style="width: 280px;">
          <el-select v-model="filterForm.task_type" placeholder="选择类型" clearable>
            <el-option label="远程桌面" value="guacamole" />
            <el-option label="Jupyter" value="jupyter" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">筛选</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="taskList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="任务标题" />
        <el-table-column label="任务类型" width="120">
          <template #default="scope">
            <el-tag :type="getTaskTypeTag(scope.row.task_type)">
              {{ getTaskTypeName(scope.row.task_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="环境模板" width="150">
          <template #default="scope">
            <span v-if="scope.row.environment">{{ scope.row.environment.name }}</span>
            <span v-else>自定义环境</span>
          </template>
        </el-table-column>
        <el-table-column label="时长/次数" width="120">
          <template #default="scope">
            {{ scope.row.max_duration ? `${scope.row.max_duration}分钟` : '不限时' }} / {{ scope.row.max_attempts }}次
          </template>
        </el-table-column>
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
            <el-button type="warning" size="small" @click="handleEditTask(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteTask(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- 添加分页组件 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="pagination.total"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTasks, deleteTask } from '../../../api/task'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const taskList = ref([])
const filterForm = reactive({
  task_type: ''
})
// 添加分页状态
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取任务类型名称
const getTaskTypeName = (type) => {
  const typeMap = {
    'guacamole': '远程桌面',
    'jupyter': 'Jupyter'
  }
  return typeMap[type] || type
}

// 获取任务类型标签样式
const getTaskTypeTag = (type) => {
  const tagMap = {
    'guacamole': 'success',
    'jupyter': 'primary'
  }
  return tagMap[type] || ''
}

// 获取任务列表
const fetchTaskList = async () => {
  try {
    loading.value = true

    // 构建查询参数
    const params = {
      skip: (pagination.currentPage - 1) * pagination.pageSize,
      limit: pagination.pageSize
    }
    if (filterForm.task_type) {
      params.task_type = filterForm.task_type
    }

    const res = await getTasks(params)
    //taskList.value = res
    taskList.value = Array.isArray(res) ? res : (res.items || [])
    pagination.total = res.total || (Array.isArray(res) ? res.length : 0)
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}
// 处理每页显示数量变化
const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.currentPage = 1 // 重置到第一页
  fetchTaskList()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  pagination.currentPage = val
  fetchTaskList()
}
// 应用筛选
const applyFilter = () => {
  pagination.currentPage = 1
  fetchTaskList()
}

// 重置筛选
const resetFilter = () => {
  filterForm.task_type = ''
  fetchTaskList()
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

.filter-card {
  margin-bottom: 20px;
}

.class-item {
  margin-bottom: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>