<template>
  <div class="experiment-container">
    <!-- <div class="watermark" v-if="currentUsername" :data-watermark="currentUsername"></div> -->
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else>
      <!-- 实验未就绪或已结束 -->
      <el-card v-if="!isRunning" class="status-card">
        <template #header>
          <div class="card-header">
            <span>实验状态</span>
          </div>
        </template>

        <div class="status-content">
          <el-result :icon="resultIcon" :title="resultTitle" :sub-title="resultSubTitle">
            <template #extra>
              <el-button type="primary" @click="backToList">返回任务列表</el-button>
            </template>
          </el-result>
        </div>
      </el-card>

      <!-- 实验就绪，显示远程桌面 -->
      <div v-else class="desktop-container">
        <div class="desktop-header">
          <div class="desktop-info">
            <el-alert type="warning" show-icon :closable="false">由于实验人数较多，如果你连接失败或者长时间无法连接（超过1分钟），请尝试刷新页面。</el-alert>
            <div class="timer" v-if="hasTimeLimit">
              剩余时间: {{ formattedTime }}
            </div>
          </div>

          <el-button type="danger" @click="confirmEndExperiment">
            结束实验
          </el-button>
        </div>

        <!-- 远程桌面iframe -->
        <iframe :src="guacamoleUrl" class="desktop-frame" allow="clipboard-read; clipboard-write"></iframe>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { checkTaskStatus, endTask, updateHeartbeat, getGuacamoleToken } from '../../api/task'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const currentUsername = computed(() => authStore.username || '')
const loading = ref(true)
const studentTaskId = ref(parseInt(route.params.id))
const taskInfo = ref({})
const guacamoleUrl = ref('')

// 时间相关
const hasTimeLimit = ref(false)
const remainingSeconds = ref(0)
const heartbeatTimer = ref(null)
const timeCountdownTimer = ref(null)

// 计算属性
const isRunning = computed(() => {
  return taskInfo.value.ecs_instance_status === 'Running'
})

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const resultIcon = computed(() => {
  const status = taskInfo.value.status
  if (!status || status === 'Stopped') {
    return 'info'
  } else if (status === 'Error') {
    return 'error'
  } else if (status === 'Preparing' || status === 'Starting') {
    return 'warning'
  } else {
    return 'info'
  }
})

const resultTitle = computed(() => {
  const status = taskInfo.value.status
  if (!status) {
    return '加载中...'
  } else if (status === 'Stopped') {
    return '实验已结束'
  } else if (status === 'Error') {
    return '实验环境出错'
  } else if (status === 'Preparing') {
    return '环境准备中'
  } else if (status === 'Starting') {
    return '环境启动中'
  } else {
    return '实验状态'
  }
})

const resultSubTitle = computed(() => {
  const status = taskInfo.value.ecs_instance_status
  if (!status) {
    return '正在获取实验信息...'
  } else if (status === 'Stopped') {
    return '实验已结束，感谢您的参与'
  } else if (status === 'Error') {
    return '实验环境出错，请联系管理员或返回重试'
  } else if (status === 'Preparing') {
    return '正在准备实验环境，请稍候...'
  } else if (status === 'Starting') {
    return '实验环境正在启动，请稍候...'
  } else {
    return '实验状态：' + status
  }
})

// 返回任务列表
const backToList = () => {
  router.push('/student/dashboard')
}

// 确认结束实验
const confirmEndExperiment = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要结束实验吗？如果你还没有完成实验，请不要结束。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 结束实验
    await endTask(studentTaskId.value)
    ElMessage.success('实验已结束')

    // 停止定时器
    stopTimers()

    // 刷新任务状态
    fetchTaskStatus()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
      console.error(error)
    }
  }
}

// 获取任务状态
const fetchTaskStatus = async () => {
  try {
    loading.value = true
    const res = await checkTaskStatus(studentTaskId.value)
    taskInfo.value = res

    // TODO: 设置时间限制
    if (res.has_time_limit && res.remaining_time) {
      hasTimeLimit.value = true
      remainingSeconds.value = res.remaining_time

      // 开始倒计时
      startTimeCountdown()
    } else {
      hasTimeLimit.value = false
    }

    // 如果实验正在运行，开始发送心跳
    if (res.ecs_instance_status === 'Running') {
      setupGuacamoleConnection();
      startHeartbeat()
    } else {
      // 如果状态是准备中或启动中，则自动刷新
      if (res.ecs_instance_status === 'Preparing' || res.ecs_instance_status === 'Starting') {
        setTimeout(fetchTaskStatus, 5000)
      }
    }
  } catch (error) {
    console.error('获取任务状态失败:', error)
    ElMessage.error('获取任务状态失败')
  } finally {
    loading.value = false
  }
}

// 开始倒计时
const startTimeCountdown = () => {
  if (timeCountdownTimer.value) clearInterval(timeCountdownTimer.value)

  timeCountdownTimer.value = setInterval(() => {
    if (remainingSeconds.value <= 0) {
      // 时间到，停止定时器并结束实验
      stopTimers()
      ElMessage.warning('实验时间已到，将自动结束')
      endTask(studentTaskId.value).then(() => {
        fetchTaskStatus()
      })
      return
    }

    remainingSeconds.value--
  }, 1000)
}

// 开始心跳
const startHeartbeat = () => {
  if (heartbeatTimer.value) clearInterval(heartbeatTimer.value)

  // 每30秒发送一次心跳
  heartbeatTimer.value = setInterval(() => {
    updateHeartbeat(studentTaskId.value).catch(error => {
      console.error('心跳失败:', error)
    })
  }, 30000)
}

// 停止所有定时器
const stopTimers = () => {
  if (timeCountdownTimer.value) {
    clearInterval(timeCountdownTimer.value)
    timeCountdownTimer.value = null
  }

  if (heartbeatTimer.value) {
    clearInterval(heartbeatTimer.value)
    heartbeatTimer.value = null
  }
}
// 获取 Guacamole 临时令牌并构建 URL
async function setupGuacamoleConnection() {
  try {
    const tokenData = await getGuacamoleToken(studentTaskId.value)
    guacamoleUrl.value = `${import.meta.env.VITE_API_URL}/guacamole/${studentTaskId.value}?token=${tokenData.token}`
    loading.value = false
  } catch (error) {
    console.error('获取 Guacamole 连接失败:', error)
    ElMessage.error('远程桌面连接失败')
  }
}
onMounted(() => {
  fetchTaskStatus()
})

onBeforeUnmount(() => {
  stopTimers()
})
</script>

<style scoped>
.experiment-container {
  height: calc(100vh - 100px);
  padding: 0;
}

.loading-box {
  padding: 50px;
}

.status-card {
  max-width: 800px;
  margin: 50px auto;
}

.desktop-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.desktop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.desktop-info {
  display: flex;
  align-items: center;
}

.desktop-info h2 {
  margin: 0;
  margin-right: 20px;
}

.timer {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
}

.desktop-frame {
  flex: 1;
  width: 100%;
  border: none;
}

/* 改进的水印样式 */
.watermark {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  pointer-events: none;
  /* 确保水印不影响用户交互 */
}

.watermark::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: 999;
  background-image: repeating-linear-gradient(-45deg,
      transparent,
      transparent 300px,
      rgba(200, 200, 200, 0.03) 300px,
      rgba(200, 200, 200, 0.03) 600px);
}

.watermark::after {
  content: attr(data-watermark);
  position: fixed;
  top: -50px;
  left: -50px;
  right: -50px;
  bottom: -50px;
  z-index: 1000;
  display: grid;
  grid-template-columns: repeat(auto-fill, 250px);
  grid-template-rows: repeat(auto-fill, 250px);
  font-size: 18px;
  font-family: Arial, sans-serif;
  color: rgba(0, 0, 0, 0.08);
  transform: rotate(-45deg);
  align-items: center;
  justify-items: center;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
}
</style>