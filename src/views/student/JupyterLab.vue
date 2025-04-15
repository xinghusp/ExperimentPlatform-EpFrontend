<template>
    <div class="jupyter-container">
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

            <!-- 实验就绪，显示Jupyter界面 -->
            <div v-else class="jupyter-view-container">
                <div class="jupyter-header">
                    <div class="jupyter-info">
                        <div class="timer" v-if="hasTimeLimit">
                            剩余时间: {{ formattedTime }}
                        </div>
                    </div>

                    <div class="header-buttons">
                        <el-button type="primary" @click="openJupyterLab">
                            打开Jupyter
                        </el-button>
                        <el-button type="danger" @click="confirmEndExperiment">
                            结束实验
                        </el-button>
                    </div>
                </div>

                <!-- Jupyter说明和相关资源 -->
                <el-card class="jupyter-info-card">
                    <template #header>
                        <div class="card-header">
                            <h3>Jupyter使用说明</h3>
                        </div>
                    </template>

                    <div class="jupyter-instructions">
                        <h4>如何使用Jupyter进行实验</h4>
                        <ol>
                            <li>点击"打开Jupyter"按钮将在新窗口中打开Web Based Python实验环境</li>
                            <li>Jupyter支持创建Notebook、编辑代码、运行分析等功能</li>
                            <li>实验结束前请保存您的工作，实验结束后环境将被销毁</li>
                            <li>如遇问题，请尝试刷新页面或联系教师</li>
                        </ol>

                        <el-divider />

                        <div class="file-operations" v-if="false"> <!--v-if="isRunning"--> <!--TODO: 后端还没实现，先隐藏了-->
                            <h4>文件管理</h4>
                            <p>上传本地文件到Jupyter环境：</p>
                            <el-upload :action="uploadUrl" :headers="uploadHeaders" multiple
                                :on-success="handleUploadSuccess" :on-error="handleUploadError">
                                <el-button type="primary">上传文件</el-button>
                            </el-upload>
                        </div>
                    </div>
                </el-card>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { checkTaskStatus, endTask, updateHeartbeat, getJupyterToken } from '../../api/task'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const studentTaskId = ref(parseInt(route.params.id))
const taskInfo = ref({})
const jupyterUrl = ref('')

// 上传相关参数
const uploadUrl = computed(() => `${import.meta.env.VITE_API_URL}/api/v1/student/${studentTaskId.value}/jupyter/upload`)
const uploadHeaders = computed(() => ({
    Authorization: `Bearer ${authStore.token}`
}))

// 时间相关
const hasTimeLimit = ref(false)
const remainingSeconds = ref(0)
const heartbeatTimer = ref(null)
const timeCountdownTimer = ref(null)

// 计算属性
const isRunning = computed(() => {
    return taskInfo.value.status === 'Running'
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
    const status = taskInfo.value.status
    if (!status) {
        return '正在获取实验信息...'
    } else if (status === 'Stopped') {
        return '实验已结束，感谢您的参与'
    } else if (status === 'Error') {
        return '实验环境出错，请联系管理员或返回重试'
    } else if (status === 'Preparing') {
        return '正在准备Jupyter实验环境，请稍候...'
    } else if (status === 'Starting') {
        return 'Jupyter实验环境正在启动，请稍候...'
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

// 在新窗口中打开Jupyter Lab
const openJupyterLab = () => {
    if (jupyterUrl.value) {
        window.open(jupyterUrl.value, '_blank')
    } else {
        ElMessage.error('Jupyter链接不可用，请稍后重试')
    }
}

// 处理文件上传成功
const handleUploadSuccess = (response) => {
    ElMessage.success('文件上传成功')
}

// 处理文件上传错误
const handleUploadError = (error) => {
    ElMessage.error('文件上传失败')
}

// 获取任务状态
const fetchTaskStatus = async () => {
    try {
        loading.value = true
        const res = await checkTaskStatus(studentTaskId.value)
        taskInfo.value = res

        // 设置时间限制
        if (res.has_time_limit && res.remaining_time) {
            hasTimeLimit.value = true
            remainingSeconds.value = res.remaining_time

            // 开始倒计时
            startTimeCountdown()
        } else {
            hasTimeLimit.value = false
        }

        // 如果实验正在运行，开始发送心跳
        if (res.status === 'Running') {
            setupJupyterConnection();
            startHeartbeat()
        } else {
            // 如果状态是准备中或启动中，则自动刷新
            if (res.status === 'Preparing' || res.status === 'Starting') {
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

// 获取 Jupyter 临时令牌并构建 URL
async function setupJupyterConnection() {
    try {
        const tokenData = await getJupyterToken(studentTaskId.value)
        jupyterUrl.value = tokenData.url
        console.log(import.meta.env.VITE_jupyterBaseUrl)
        if (tokenData.port != null) { // nginx+cookie认证没搞定，临时先用端口直接访问了
            jupyterUrl.value = "http://" + (import.meta.env.VITE_jupyterBaseUrl ?? location.hostname) + ":" + tokenData.port
        }
        loading.value = false
    } catch (error) {
        console.error('获取 Jupyter 连接失败:', error)
        ElMessage.error('Jupyter连接失败')
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
.jupyter-container {
    height: calc(100vh - 100px);
    padding: 10px;
}

.loading-box {
    padding: 50px;
}

.status-card {
    max-width: 800px;
    margin: 50px auto;
}

.jupyter-view-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.jupyter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #f5f7fa;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
}

.jupyter-info {
    flex-grow: 1;
}

.header-buttons {
    display: flex;
    gap: 10px;
}

.timer {
    font-size: 16px;
    font-weight: bold;
    color: #409EFF;
    margin-top: 10px;
}

.jupyter-info-card {
    margin-bottom: 20px;
}

.jupyter-instructions {
    line-height: 1.6;
}

.file-operations {
    margin-top: 20px;
}
</style>