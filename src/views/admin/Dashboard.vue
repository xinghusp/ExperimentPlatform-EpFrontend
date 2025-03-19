<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>班级总数</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="stats.classCount">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  班级
                  <el-icon style="margin-left: 4px">
                    <User />
                  </el-icon>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>学生总数</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="stats.studentCount">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  学生
                  <el-icon style="margin-left: 4px">
                    <UserFilled />
                  </el-icon>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>任务总数</span>
            </div>
          </template>
          <div class="card-content">
            <el-statistic :value="stats.taskCount">
              <template #title>
                <div style="display: inline-flex; align-items: center">
                  任务
                  <el-icon style="margin-left: 4px">
                    <Document />
                  </el-icon>
                </div>
              </template>
            </el-statistic>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>活跃实验</span>
            </div>
          </template>
          <el-table :data="activeExperiments" stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="student_name" label="学生" />
            <el-table-column prop="task_name" label="任务" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_at" label="开始时间">
              <template #default="scope">
                {{ formatDate(scope.row.start_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="danger" size="small" @click="handleForceEnd(scope.row)">
                  强制结束
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>最近任务</span>
              <el-button type="primary" size="small" @click="handleCreateTask">创建任务</el-button>
            </div>
          </template>
          <el-table :data="recentTasks" stripe style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="created_at" label="创建时间">
              <template #default="scope">
                {{ formatDate(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleEditTask(scope.row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStudentTasks, forceEndStudentTask, getTasks } from '../../api/task'
import { getClasses } from '../../api/class'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const activeExperiments = ref([])
const recentTasks = ref([])

const stats = reactive({
  classCount: 0,
  studentCount: 0,
  taskCount: 0
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 根据状态获取标签类型
const getStatusType = (status) => {
  const statusMap = {
    'Running': 'success',
    'Starting': 'warning',
    'Preparing': 'info',
    'Stopped': 'danger',
    'Error': 'danger'
  }
  return statusMap[status] || 'info'
}

// 强制结束实验
const handleForceEnd = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要强制结束该实验吗？实验数据可能会丢失。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await forceEndStudentTask(row.id)
    ElMessage.success('操作成功，实验将被强制结束')

    // 刷新数据
    fetchActiveExperiments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 跳转到创建任务
const handleCreateTask = () => {
  router.push('/admin/tasks/create')
}

// 跳转到编辑任务
const handleEditTask = (row) => {
  router.push(`/admin/tasks/${row.id}`)
}

// 获取活跃实验
const fetchActiveExperiments = async () => {
  try {
    loading.value = true
    const res = await getStudentTasks({
      status: 'Running',
      limit: 10
    })
    activeExperiments.value = res
  } catch (error) {
    console.error('获取活跃实验失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取最近任务
const fetchRecentTasks = async () => {
  try {
    const res = await getTasks({
      limit: 10
    })
    recentTasks.value = res
  } catch (error) {
    console.error('获取最近任务失败:', error)
  }
}

// 获取统计信息
const fetchStats = async () => {
  try {
    // 获取班级总数
    const classesRes = await getClasses()
    stats.classCount = classesRes.length

    // 计算学生总数
    let studentCount = 0
    classesRes.forEach(item => {
      studentCount += item.student_count || 0
    })
    stats.studentCount = studentCount

    // 获取任务总数
    const tasksRes = await getTasks()
    stats.taskCount = tasksRes.length
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

onMounted(() => {
  fetchActiveExperiments()
  fetchRecentTasks()
  fetchStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 10px;
}

.dashboard-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}
</style>