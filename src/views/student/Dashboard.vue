<template>
  <div class="student-dashboard">
    <h2 class="page-title">我的实验</h2>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>可用实验</span>
            </div>
          </template>

          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>

          <div v-else-if="taskList.length === 0" class="empty-container">
            <el-empty description="暂无可用实验" />
          </div>

          <el-row :gutter="20" v-else>
            <el-col v-for="task in taskList" :key="task.id" :xs="24" :sm="12" :md="8" :lg="6" class="task-card-col">
              <el-card class="task-card" shadow="hover">
                <div class="task-header">
                  <h3 class="task-title">{{ task.title }}</h3>
                  <el-tag :type="getStatusType(task.status)" class="task-status" v-if="task.status">
                    {{ getStatusText(task.status) }}
                  </el-tag>
                </div>

                <div class="task-content">
                  <p class="task-desc">{{ task.description || '无描述' }}</p>
                  <p class="task-info">
                    <el-icon>
                      <Clock />
                    </el-icon>
                    <span>实验时长: {{ task.max_duration ? `${task.max_duration}分钟` : '无限制' }}</span>
                  </p>
                  <p class="task-info">
                    <el-icon>
                      <RefreshRight />
                    </el-icon>
                    <span>剩余次数: {{ task.remaining_attempts }}</span>
                  </p>
                </div>

                <div class="task-footer">
                  <el-button type="primary" :disabled="!canStart(task)" @click="handleStartTask(task)">
                    {{ getButtonText(task) }}
                  </el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实验准备中的弹窗 -->
    <el-dialog v-model="preparingDialog.visible" title="实验准备中" :close-on-click-modal="false"
      :close-on-press-escape="false" :show-close="false" width="400px">
      <div class="preparing-content">
        <el-progress type="circle" :percentage="preparingDialog.percentage" />
        <p class="preparing-text">{{ preparingDialog.message }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getStudentTaskList, startTask, getStudentTaskStatus } from '../../api/task'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const taskList = ref([])

// 准备状态对话框
const polling = ref(null)
const preparingDialog = ref({
  visible: false,
  taskId: null,
  studentTaskId: null,  // 确保保存这个ID
  status: 'Preparing',
  message: '正在准备实验环境，请稍候...',
  percentage: 0
})

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    'Running': 'success',
    'Starting': 'warning',
    'Preparing': 'info',
    'Stopped': 'info',
    'Error': 'danger'
  }
  return statusMap[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'Running': '运行中',
    'Starting': '启动中',
    'Preparing': '准备中',
    'Stopped': '已停止',
    'Error': '错误',
    'Not Started': '未进行'
  }
  return statusMap[status] || status
}

// 获取按钮文本
const getButtonText = (task) => {
  if (task.status === 'Running' || task.status === 'Starting' || task.status === 'Preparing') {
    return '进入实验'
  } else if (task.remaining_attempts <= 0) {
    return '次数已用完'
  } else {
    return '开始实验'
  }
}

// 判断是否可以开始实验
const canStart = (task) => {
  return task.remaining_attempts > 0 || task.status === 'Running' ||
    task.status === 'Starting' || task.status === 'Preparing'
}

// 获取任务列表
const fetchTaskList = async () => {
  try {
    loading.value = true
    const res = await getStudentTaskList()
    taskList.value = res
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

async function handleStartTask(task) {
  try {
    // 检查剩余尝试次数
    if (task.remaining_attempts <= 0) {
      ElMessage.error('您已用完所有实验次数，请与老师联系。')
      return
    }

    if (task.status === 'Running') {
      // 如果任务已经在运行，直接跳转到任务页面
      router.push(`/student/tasks/${task.id}`)
      return
    }

    if (task.status === 'Preparing' || task.status === 'Starting') {
      // 如果任务正在准备中或启动中，显示准备对话框并开始轮询状态
      preparingDialog.value.visible = true
      preparingDialog.value.taskId = task.id
      preparingDialog.value.studentTaskId = task.student_task_id  // 保存学生任务ID
      preparingDialog.value.status = task.status
      startStatusPolling(task.student_task_id)  // 使用已有的ID开始轮询
      return
    }

    // 否则，启动新任务
    const res = await startTask(task.id)

    // 设置准备对话框
    preparingDialog.value.visible = true
    preparingDialog.value.taskId = task.id
    preparingDialog.value.studentTaskId = res.student_task_id  // 保存返回的学生任务ID
    preparingDialog.value.status = 'Preparing'

    // 开始轮询状态
    startStatusPolling(res.student_task_id)
  } catch (error) {
    console.error('启动任务失败:', error)
    ElMessage.error('启动任务失败')
  }
}

// 修改状态轮询方法
function startStatusPolling(studentTaskId) {
  // 确保有 studentTaskId
  if (!studentTaskId) {
    console.error('Missing studentTaskId, cannot start polling')
    ElMessage.error('无法监控任务状态')
    return
  }

  // 清除之前的轮询
  if (polling.value) {
    clearInterval(polling.value)
  }

  // 设置新的轮询
  polling.value = setInterval(async () => {
    try {
      const status = await getStudentTaskStatus(studentTaskId)

      preparingDialog.value.status = status.ecs_instance_status

      // 根据状态更新消息
      if (status.ecs_instance_status === 'Preparing') {
        preparingDialog.value.message = '正在准备实验环境，请稍候...'
        preparingDialog.value.percentage = preparingDialog.value.percentage < 50 ? ++preparingDialog.value.percentage : 50;
      } else if (status.ecs_instance_status === 'Starting') {
        preparingDialog.value.message = '实验环境即将就绪，请稍候...'
        preparingDialog.value.percentage = preparingDialog.value.percentage < 99 ? ++preparingDialog.value.percentage : 99;;
      } else if (status.ecs_instance_status === 'Running') {
        preparingDialog.value.percentage = 100;
        // 环境就绪，停止轮询并跳转
        clearInterval(polling.value)
        preparingDialog.value.visible = false
        ElMessage.success('实验环境已就绪')
        router.push(`/student/experiment/${preparingDialog.value.studentTaskId}`)
      } else if (['Stopped', 'Error'].includes(status.ecs_instance_status)) {
        // 发生错误，停止轮询
        clearInterval(polling.value)
        preparingDialog.value.visible = false
        ElMessage.error('实验环境准备失败，请稍后重试')
        // 重新加载任务列表
        fetchTaskList()
      }
    } catch (error) {
      console.error('获取任务状态失败:', error)
      clearInterval(polling.value)
      preparingDialog.value.visible = false
      ElMessage.error('获取任务状态失败')
    }
  }, 2000) // 每2秒轮询一次
}

// 组件卸载前清除轮询
onBeforeUnmount(() => {
  if (polling.value) {
    clearInterval(polling.value)
  }
})

// 页面加载时检查是否有正在进行的任务
onMounted(() => {
  fetchTaskList().then(() => {
    // 检查是否有正在准备中的任务
    const preparingTask = taskList.value.find(
      task => task.status === 'Preparing' || task.status === 'Starting'
    )

    if (preparingTask && preparingTask.student_task_id) {
      // 如果有，显示准备对话框并开始轮询
      handleStartTask(preparingTask)
    }
  })
})
</script>

<style scoped>
.student-dashboard {
  padding: 10px;
}

.page-title {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-container,
.empty-container {
  padding: 40px 0;
  text-align: center;
}

.task-card-col {
  margin-bottom: 20px;
}

.task-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.task-title {
  margin: 0;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-content {
  flex-grow: 1;
}

.task-desc {
  color: #606266;
  margin-bottom: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.task-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-bottom: 8px;
  color: #606266;
}

.task-info .el-icon {
  margin-right: 5px;
}

.task-footer {
  margin-top: 15px;
  text-align: center;
}

.preparing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.preparing-text {
  margin-top: 20px;
  text-align: center;
}
</style>