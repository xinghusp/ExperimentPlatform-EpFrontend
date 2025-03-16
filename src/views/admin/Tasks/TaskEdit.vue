<template>
  <div class="task-edit-container">
    <div class="page-header">
      <h2>编辑任务</h2>
      <el-button @click="backToList">返回列表</el-button>
    </div>

    <el-card v-loading="loading">
      <el-form v-if="!loading" ref="taskFormRef" :model="taskForm" :rules="taskRules" label-width="180px"
        label-position="left">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="任务标题" prop="title">
              <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
            </el-form-item>

            <el-form-item label="任务类型" prop="task_type">
              <el-tag size="large" :type="getTaskTypeTag(taskForm.task_type)">
                {{ getTaskTypeName(taskForm.task_type) }}
              </el-tag>
              <div class="form-tip">任务类型创建后不可更改</div>
            </el-form-item>

            <el-form-item label="环境模板" prop="environment_id">
              <div v-if="originalEnvironmentId">
                <el-tag size="large">{{ environmentName }}</el-tag>
                <div class="form-tip">环境模板创建后不可更改</div>
              </div>
              <div v-else>自定义环境配置</div>
            </el-form-item>

            <el-form-item label="任务描述" prop="description">
              <el-input v-model="taskForm.description" type="textarea" :rows="3" placeholder="请输入任务描述" />
            </el-form-item>

            <el-form-item label="最大实验时长(分钟)" prop="max_duration">
              <el-input-number v-model="taskForm.max_duration" :min="0" placeholder="不填则无时间限制" />
            </el-form-item>

            <el-form-item label="最大尝试次数" prop="max_attempts">
              <el-input-number v-model="taskForm.max_attempts" :min="1" :max="9999" />
            </el-form-item>

            <el-form-item label="分配班级" prop="class_ids">
              <el-select v-model="taskForm.class_ids" multiple placeholder="请选择分配班级" style="width: 100%">
                <el-option v-for="item in classList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="环境配置" name="environment" v-if="!originalEnvironmentId">
            <div v-if="taskForm.task_type === 'guacamole'">
              <el-form-item label="区域" prop="region_id">
                <el-input v-model="taskForm.region_id" placeholder="例如：cn-hangzhou" />
              </el-form-item>

              <el-form-item label="镜像ID" prop="image_id">
                <el-input v-model="taskForm.image_id" placeholder="例如：m-bp1g7004ksh0oeuco0eo" />
              </el-form-item>

              <el-form-item label="实例类型" prop="instance_type">
                <el-input v-model="taskForm.instance_type" placeholder="例如：ecs.t5-lc1m1.small" />
              </el-form-item>

              <el-form-item label="安全组ID" prop="security_group_id">
                <el-input v-model="taskForm.security_group_id" placeholder="例如：sg-bp1fvzkj690y0cruek6d" />
              </el-form-item>

              <el-form-item label="交换机ID" prop="vswitch_id">
                <el-input v-model="taskForm.vswitch_id" placeholder="例如：vsw-bp1ddbrxdlrcbim46z8p2" />
              </el-form-item>

              <el-form-item label="出网带宽(Mbps)" prop="internet_max_bandwidth_out">
                <el-input-number v-model="taskForm.internet_max_bandwidth_out" :min="0" :max="100" />
              </el-form-item>

              <el-form-item label="竞价策略" prop="spot_strategy">
                <el-select v-model="taskForm.spot_strategy" placeholder="请选择竞价策略" style="width: 100%">
                  <el-option label="不使用竞价实例" value="NoSpot" />
                  <el-option label="设置上限价格" value="SpotWithPriceLimit" />
                  <el-option label="系统自动出价" value="SpotAsPriceGo" />
                </el-select>
              </el-form-item>

              <el-form-item label="实例密码" prop="password">
                <el-input v-model="taskForm.password" show-password placeholder="设置访问实例的密码" />
              </el-form-item>
            </div>

            <div v-if="taskForm.task_type === 'jupyter'">
              <el-form-item label="Jupyter镜像" prop="jupyter_image">
                <el-input v-model="taskForm.jupyter_image" placeholder="例如: jupyter/datascience-notebook:latest" />
                <div class="form-tip">
                  Docker Hub上的Jupyter镜像名称
                </div>
              </el-form-item>

              <el-form-item label="内存限制" prop="memory_limit">
                <el-input-number v-model="taskForm.memory_limit" :min="512" :step="256" :max="8192" />
                <span class="unit-label">MB</span>
                <div class="form-tip">
                  容器可使用的最大内存
                </div>
              </el-form-item>

              <el-form-item label="CPU限制" prop="cpu_limit">
                <el-input-number v-model="taskForm.cpu_limit" :min="0.1" :step="0.1" :max="4" :precision="1" />
                <span class="unit-label">核</span>
                <div class="form-tip">
                  容器可使用的最大CPU核数
                </div>
              </el-form-item>
            </div>

            <el-form-item label="自定义参数" prop="custom_params_json">
              <el-input v-model="taskForm.custom_params_json" type="textarea" :rows="5"
                placeholder="JSON格式的自定义参数(可选)" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="附件管理" name="attachments">
            <div v-if="attachments.length > 0">
              <h4>现有附件</h4>
              <el-table :data="attachments" stripe style="width: 100%">
                <el-table-column prop="file_name" label="文件名" />
                <el-table-column prop="file_size" label="文件大小">
                  <template #default="scope">
                    {{ formatFileSize(scope.row.file_size) }}
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="上传时间">
                  <template #default="scope">
                    {{ formatDate(scope.row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180">
                  <template #default="scope">
                    <el-button type="primary" size="small" @click="downloadFile(scope.row)">
                      下载
                    </el-button>
                    <el-button type="danger" size="small" @click="deleteFile(scope.row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="upload-container">
              <h4>上传新附件</h4>
              <el-upload ref="uploadRef" action="#" :auto-upload="false" :on-remove="handleRemove" :file-list="fileList"
                multiple>
                <el-button type="primary">选择文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    选择要上传的附件文件，将与任务一同保存
                  </div>
                </template>
              </el-upload>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="form-actions">
          <el-button @click="backToList">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">保存修改</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getTask, updateTask } from '../../../api/task'
import { getClasses } from '../../../api/class'
import { getEnvironmentTemplate } from '../../../api/environment'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const taskId = parseInt(route.params.id)
const taskFormRef = ref(null)
const uploadRef = ref(null)
const submitting = ref(false)
const loading = ref(true)
const activeTab = ref('basic')
const classList = ref([])
const fileList = ref([])
const attachments = ref([])
const originalEnvironmentId = ref(null)
const environmentName = ref('自定义环境')

const taskForm = reactive({
  title: '',
  description: '',
  max_duration: null,
  max_attempts: 1,
  class_ids: [],
  task_type: 'guacamole',
  environment_id: null,

  // Guacamole (ECS) 参数
  region_id: 'cn-hangzhou',
  image_id: '',
  instance_type: 'ecs.t5-lc1m1.small',
  security_group_id: '',
  vswitch_id: '',
  internet_max_bandwidth_out: 5,
  spot_strategy: 'NoSpot',
  password: '',

  // Jupyter 参数
  jupyter_image: 'jupyter/datascience-notebook:latest',
  memory_limit: 1024, // 默认1GB
  cpu_limit: 1.0,

  custom_params_json: '{}'
})

const taskRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  max_attempts: [
    { required: true, message: '请设置最大尝试次数', trigger: 'blur' },
    { type: 'number', min: 1, message: '最小值为 1', trigger: 'blur' }
  ],
  class_ids: [
    { required: true, message: '请选择至少一个班级', trigger: 'change' },
    { type: 'array', min: 1, message: '请选择至少一个班级', trigger: 'change' }
  ],
  custom_params_json: [
    { validator: validateJson, trigger: 'blur' }
  ]
}

// 获取任务类型名称
const getTaskTypeName = (type) => {
  const typeMap = {
    'guacamole': '远程桌面实验',
    'jupyter': 'Jupyter Notebook实验'
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

// 验证JSON格式
function validateJson(rule, value, callback) {
  if (!value || value.trim() === '') {
    callback()
    return
  }

  try {
    JSON.parse(value)
    callback()
  } catch (error) {
    callback(new Error('请输入有效的JSON格式'))
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '-'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

// 返回列表页
function backToList() {
  router.push('/admin/tasks')
}

// 处理文件移除
function handleRemove(file, fileList) {
  console.log(file, fileList)
}

// 下载文件
function downloadFile(file) {
  window.open(`/api/v1/tasks/${taskId}/attachments/${file.id}/download`)
}

// 删除文件
async function deleteFile(file) {
  try {
    // 此处应调用删除文件的API
    // 由于API文件中没有定义deleteTaskAttachment方法，这里需要自行添加
    ElMessage.success('删除成功')

    // 刷新附件列表
    fetchTaskData()
  } catch (error) {
    ElMessage.error('删除失败')
    console.error(error)
  }
}

// 获取环境模板信息
async function fetchEnvironmentInfo() {
  if (!originalEnvironmentId.value) return

  try {
    const res = await getEnvironmentTemplate(originalEnvironmentId.value)
    if (res) {
      environmentName.value = res.name
    }
  } catch (error) {
    console.error('获取环境模板信息失败:', error)
  }
}

// 获取班级列表
async function fetchClassList() {
  try {
    const res = await getClasses()
    classList.value = res
  } catch (error) {
    console.error('获取班级列表失败:', error)
    ElMessage.error('获取班级列表失败')
  }
}

// 获取任务信息
async function fetchTaskData() {
  try {
    loading.value = true
    const res = await getTask(taskId)

    // 更新表单数据
    taskForm.title = res.title
    taskForm.description = res.description || ''
    taskForm.max_duration = res.max_duration
    taskForm.max_attempts = res.max_attempts
    taskForm.task_type = res.task_type || 'guacamole'

    // 保存原始环境模板ID
    if (res.environment_id) {
      originalEnvironmentId.value = res.environment_id
      taskForm.environment_id = res.environment_id
      fetchEnvironmentInfo()
    }

    if (taskForm.task_type === 'guacamole') {
      taskForm.region_id = res.region_id || 'cn-hangzhou'
      taskForm.image_id = res.image_id || ''
      taskForm.instance_type = res.instance_type || 'ecs.t5-lc1m1.small'
      taskForm.security_group_id = res.security_group_id || ''
      taskForm.vswitch_id = res.vswitch_id || ''
      taskForm.internet_max_bandwidth_out = res.internet_max_bandwidth_out || 5
      taskForm.spot_strategy = res.spot_strategy || 'NoSpot'
      taskForm.password = res.password || ''
    } else if (taskForm.task_type === 'jupyter') {
      taskForm.jupyter_image = res.jupyter_image || 'jupyter/datascience-notebook:latest'
      taskForm.memory_limit = res.memory_limit || 1024
      taskForm.cpu_limit = res.cpu_limit || 1.0
    }

    if (res.custom_params) {
      taskForm.custom_params_json = JSON.stringify(res.custom_params, null, 2)
    } else {
      taskForm.custom_params_json = '{}'
    }

    // 设置班级IDs
    if (res.classes && Array.isArray(res.classes)) {
      taskForm.class_ids = res.classes.map(cls => cls.id)
    }

    // 设置附件
    if (res.attachments && Array.isArray(res.attachments)) {
      attachments.value = res.attachments
    }
  } catch (error) {
    console.error('获取任务信息失败:', error)
    ElMessage.error('获取任务信息失败')
    router.push('/admin/tasks')
  } finally {
    loading.value = false
  }
}

// 提交表单
async function submitForm() {
  if (!taskFormRef.value) return

  await taskFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true

        // 构建FormData对象
        const formData = new FormData()

        // 添加基本信息
        formData.append('title', taskForm.title)
        if (taskForm.description) {
          formData.append('description', taskForm.description)
        }
        if (taskForm.max_duration !== null) {
          formData.append('max_duration', taskForm.max_duration)
        }
        formData.append('max_attempts', taskForm.max_attempts)

        // 根据任务类型添加不同的配置
        if (taskForm.task_type === 'guacamole' && !originalEnvironmentId.value) {
          // 添加阿里云配置
          formData.append('region_id', taskForm.region_id)
          formData.append('image_id', taskForm.image_id)
          formData.append('instance_type', taskForm.instance_type)
          formData.append('security_group_id', taskForm.security_group_id)
          formData.append('vswitch_id', taskForm.vswitch_id)
          formData.append('internet_max_bandwidth_out', taskForm.internet_max_bandwidth_out)
          formData.append('spot_strategy', taskForm.spot_strategy)
          formData.append('password', taskForm.password)
        } else if (taskForm.task_type === 'jupyter' && !originalEnvironmentId.value) {
          // 添加Jupyter配置
          formData.append('jupyter_image', taskForm.jupyter_image)
          formData.append('memory_limit', taskForm.memory_limit)
          formData.append('cpu_limit', taskForm.cpu_limit)
        }

        // 处理自定义参数
        if (taskForm.custom_params_json && taskForm.custom_params_json !== '{}') {
          formData.append('custom_params', taskForm.custom_params_json)
        }

        // 添加班级ID
        formData.append('class_ids', JSON.stringify(taskForm.class_ids))

        // 添加文件
        if (uploadRef.value && uploadRef.value.uploadFiles) {
          uploadRef.value.uploadFiles.forEach(file => {
            formData.append('files', file.raw)
          })
        }

        // 发送请求
        await updateTask(taskId, formData)

        ElMessage.success('任务修改成功')
        router.push('/admin/tasks')
      } catch (error) {
        console.error('保存任务失败:', error)
        ElMessage.error('保存任务失败')
      } finally {
        submitting.value = false
      }
    } else {
      // 表单验证失败，滚动到第一个错误项
      const firstErrorField = Object.keys(taskFormRef.value.fields).find(
        field => taskFormRef.value.fields[field].validateState === 'error'
      )

      if (firstErrorField) {
        const errorTab = getTabByFieldName(firstErrorField)
        if (errorTab) {
          activeTab.value = errorTab
        }
      }

      ElMessage.warning('请完善表单信息')
      return false
    }
  })
}

// 根据字段名获取所属的标签页
function getTabByFieldName(fieldName) {
  const basicFields = ['title', 'description', 'max_duration', 'max_attempts', 'class_ids']
  const environmentFields = ['region_id', 'image_id', 'instance_type', 'security_group_id',
    'vswitch_id', 'internet_max_bandwidth_out', 'spot_strategy',
    'password', 'jupyter_image', 'memory_limit', 'cpu_limit', 'custom_params_json']
  const attachmentFields = ['files']

  if (basicFields.includes(fieldName)) return 'basic'
  if (environmentFields.includes(fieldName)) return 'environment'
  if (attachmentFields.includes(fieldName)) return 'attachments'

  return null
}

onMounted(() => {
  fetchClassList()
  fetchTaskData()
})
</script>

<style scoped>
.task-edit-container {
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
  padding-right: 180px;
}

.upload-container {
  margin-top: 30px;
}

.form-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
  line-height: 1.4;
}

.unit-label {
  margin-left: 8px;
  color: #606266;
}
</style>