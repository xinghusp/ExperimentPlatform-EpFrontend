<template>
  <div class="task-monitor-container">
    <div class="page-header">
      <h2>任务监控</h2>
      <div class="refresh-control">
        <el-switch v-model="autoRefresh" active-text="自动刷新" inactive-text="手动刷新" @change="handleAutoRefreshChange" />
        <el-button :icon="Refresh" circle @click="fetchStudentTasks" :loading="loading" />
      </div>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="任务">
          <el-select v-model="filterForm.taskId" placeholder="选择任务" clearable style="width: 200px">
            <el-option v-for="item in taskList" :key="item.id" :label="item.title" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable style="width: 150px">
            <el-option label="运行中" value="Running" />
            <el-option label="启动中" value="Starting" />
            <el-option label="准备中" value="Preparing" />
            <el-option label="已停止" value="Stopped" />
            <el-option label="错误" value="Error" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.taskType" placeholder="选择类型" clearable style="width: 150px">
            <el-option label="远程桌面" value="guacamole" />
            <el-option label="Jupyter" value="jupyter" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select v-model="filterForm.classId" placeholder="选择班级" clearable style="width: 150px">
            <el-option v-for="item in classList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">筛选</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="studentTasks" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="学生" width="120">
          <template #default="scope">
            {{ scope.row.student?.name || '未知' }}
            <el-tooltip content="学号" placement="top">
              <el-text type="info" class="student-id">{{ scope.row.student_id }}</el-text>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="任务" width="180">
          <template #default="scope">
            <div>{{ scope.row.task?.title }}</div>
            <el-tag size="small" :type="getTaskTypeTag(scope.row.task_type)">
              {{ getTaskTypeName(scope.row.task_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column label="访问信息" width="140">
          <template #default="scope">
            <template v-if="scope.row.task_type === 'guacamole'">
              <span v-if="scope.row.ecs_ip_address">
                {{ scope.row.ecs_ip_address }}
                <el-button :icon="CopyDocument" circle size="small" link
                  @click="copyToClipboard(scope.row.ecs_ip_address)" />
              </span>
              <span v-else>-</span>
            </template>
            <template v-else-if="scope.row.task?.task_type === 'jupyter'">
              <el-button size="small" type="primary" :disabled="!isRunning(scope.row)"
                @click="openJupyterUrl(scope.row)">
                打开Jupyter
              </el-button>
            </template>
          </template>
        </el-table-column> -->
        <el-table-column label="开始/结束时间" width="300">
          <template #default="scope">
            <div>开始：{{ formatDate(scope.row.start_at) }}</div>
            <div>结束：{{ formatDate(scope.row.end_at) || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="计时" width="130">
          <template #default="scope">
            <div>
              <el-tooltip content="已运行时间" placement="top">
                <span>{{ calculateRuntime(scope.row) }}</span>
              </el-tooltip>
            </div>
            <div v-if="scope.row.task?.max_duration && isRunning(scope.row)">
              <el-tooltip content="剩余时间" placement="top">
                <el-progress :percentage="calculateTimeRemaining(scope.row).percentage"
                  :status="calculateTimeRemaining(scope.row).status" :stroke-width="6" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="attempt_number" label="尝试次数" width="80" />
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="scope">
            <el-button type="danger" size="small" @click="handleForceEnd(scope.row)" :disabled="!isRunning(scope.row)">
              强制结束
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          background layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { getStudentTasks, forceEndStudentTask, getTasks } from '../../../api/task'
import { getClasses } from '../../../api/class'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Refresh, CopyDocument } from '@element-plus/icons-vue'

const loading = ref(false)
const studentTasks = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const autoRefresh = ref(false)
const refreshInterval = ref(null)
const taskList = ref([])
const classList = ref([])

const filterForm = reactive({
  taskId: null,
  status: null,
  classId: null,
  taskType: null
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    'Running': 'success',
    'Starting': 'warning',
    'Preparing': 'info',
    'Stopped': 'info',
    'Error': 'danger'
  }
  return statusMap[status] || 'info'
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

// 检查实验是否运行中
const isRunning = (task) => {
  const status = task.ecs_instance_status || task.container_status
  return status === 'Running' || status === 'Starting'
}

// 计算运行时长
const calculateRuntime = (task) => {
  if (!task.start_at) return '-'

  const start = new Date(task.start_at)
  const end = task.end_at ? new Date(task.end_at) : new Date()

  const diff = Math.floor((end - start) / 1000)

  if (diff < 60) return `${diff}秒`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时${Math.floor((diff % 3600) / 60)}分钟`
  return `${Math.floor(diff / 86400)}天${Math.floor((diff % 86400) / 3600)}小时`
}

// 计算剩余时间
const calculateTimeRemaining = (task) => {
  if (!task.start_at || !task.task?.max_duration) {
    return { percentage: 0, status: '' }
  }

  const start = new Date(task.start_at)
  const now = new Date()
  const totalSeconds = task.task.max_duration * 60
  const elapsedSeconds = Math.floor((now - start) / 1000)
  const remainingSeconds = totalSeconds - elapsedSeconds

  if (remainingSeconds <= 0) {
    return { percentage: 100, status: 'exception' }
  }

  const percentage = Math.floor((elapsedSeconds / totalSeconds) * 100)
  let status = ''

  if (percentage >= 80) {
    status = 'exception'
  } else if (percentage >= 60) {
    status = 'warning'
  } else {
    status = 'success'
  }

  return { percentage, status }
}

// 打开Jupyter URL
const openJupyterUrl = (task) => {
  if (!task.jupyter_url) {
    ElMessage.warning('Jupyter访问链接不可用')
    return
  }

  window.open(task.jupyter_url, '_blank')
}

// 获取学生任务列表
const fetchStudentTasks = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      task_id: filterForm.taskId,
      status: filterForm.status,
      class_id: filterForm.classId,
      task_type: filterForm.taskType
    }

    const res = await getStudentTasks(params)
    studentTasks.value = Array.isArray(res) ? res : (res.items || [])
    total.value = res.total || (Array.isArray(res) ? res.length : 0)
  } catch (error) {
    console.error('获取任务执行记录失败:', error)
    ElMessage.error('获取任务执行记录失败')
  } finally {
    loading.value = false
  }
}

// 获取任务列表
const fetchTasks = async () => {
  try {
    const res = await getTasks()
    taskList.value = res
  } catch (error) {
    console.error('获取任务列表失败:', error)
  }
}

// 获取班级列表
const fetchClasses = async () => {
  try {
    const res = await getClasses()
    classList.value = res
  } catch (error) {
    console.error('获取班级列表失败:', error)
  }
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchStudentTasks()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchStudentTasks()
}

// 应用筛选
const applyFilter = () => {
  currentPage.value = 1
  fetchStudentTasks()
}

// 重置筛选
const resetFilter = () => {
  filterForm.taskId = null
  filterForm.status = null
  filterForm.classId = null
  filterForm.taskType = null
  applyFilter()
}

// 强制结束任务
const handleForceEnd = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要强制结束该实验吗？实验数据可能会丢失。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await forceEndStudentTask(row.id)
    ElMessage.success('操作成功，实验将被强制结束')

    // 延迟刷新数据，等待后端处理
    setTimeout(() => {
      fetchStudentTasks()
    }, 1000)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 处理自动刷新
const handleAutoRefreshChange = (value) => {
  if (value) {
    // 开启自动刷新，每30秒刷新一次
    refreshInterval.value = setInterval(() => {
      fetchStudentTasks()
    }, 30000)
  } else {
    // 关闭自动刷新
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }
}

onMounted(() => {
  fetchTasks()
  fetchClasses()
  fetchStudentTasks()
})

onBeforeUnmount(() => {
  // 清理定时器
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
})
</script>

<style scoped>
.task-monitor-container {
  padding: 10px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.student-id {
  font-size: 12px;
  margin-left: 5px;
}
</style>