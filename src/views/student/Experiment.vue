<template>
  <div class="experiment-container">
    <div v-if="loading" class="loading-box">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else>
      <!-- 根据任务类型渲染不同的实验组件 -->
      <JupyterLab v-if="taskInfo.task_type === 'jupyter'" :student-task-id="studentTaskId" />
      <GuacamoleDesktop v-else-if="taskInfo.task_type === 'guacamole'" :student-task-id="studentTaskId" />

      <!-- 任务类型不支持或未知 -->
      <el-card v-else class="status-card">
        <template #header>
          <div class="card-header">
            <span>实验环境</span>
          </div>
        </template>

        <div class="status-content">
          <el-result icon="error" title="不支持的实验类型" sub-title="该实验类型暂不支持或无法识别">
            <template #extra>
              <el-button type="primary" @click="backToList">返回任务列表</el-button>
            </template>
          </el-result>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { checkTaskStatus } from '../../api/task'
import { ElMessage } from 'element-plus'
import JupyterLab from './JupyterLab.vue'
import GuacamoleDesktop from './GuacamoleDesktop.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const studentTaskId = ref(parseInt(route.params.id))
const taskInfo = ref({})

// 返回任务列表
const backToList = () => {
  router.push('/student/dashboard')
}

// 获取任务状态和类型信息
const fetchTaskStatus = async () => {
  try {
    loading.value = true
    const res = await checkTaskStatus(studentTaskId.value)
    taskInfo.value = res

    // 如果实验状态异常或已结束，显示提示并返回列表
    if (res.ecs_instance_status === 'Error' || res.container_status === 'Error' ||
      res.ecs_instance_status === 'Stopped' || res.container_status === 'Stopped') {
      ElMessage.warning('实验已结束或出现错误')
      setTimeout(() => {
        backToList()
      }, 3000)
    }
  } catch (error) {
    console.error('获取任务状态失败:', error)
    ElMessage.error('获取任务状态失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTaskStatus()
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
</style>