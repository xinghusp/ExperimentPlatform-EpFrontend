<template>
  <div class="task-create-container">
    <div class="page-header">
      <h2>创建新任务</h2>
      <el-button @click="backToList">返回列表</el-button>
    </div>

    <el-card>
      <el-form ref="taskFormRef" :model="taskForm" :rules="taskRules" label-width="180px" label-position="left">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="任务标题" prop="title">
              <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
            </el-form-item>

            <el-form-item label="任务类型" prop="task_type">
              <el-select v-model="taskForm.task_type" placeholder="请选择任务类型" style="width: 100%"
                @change="handleTaskTypeChange">
                <el-option label="远程桌面实验 (Guacamole)" value="guacamole" />
                <el-option label="Jupyter Notebook实验" value="jupyter" />
              </el-select>
            </el-form-item>

            <el-form-item label="环境模板" prop="environment_id">
              <el-select v-model="taskForm.environment_id" placeholder="请选择环境模板" style="width: 100%"
                @change="handleEnvironmentChange">
                <el-option v-for="item in environmentList" :key="item.id"
                  :label="`${item.name} (${getEnvironmentTypeName(item.type)})`" :value="item.id" />
              </el-select>
              <div class="form-tip">
                <el-link type="primary" @click="openNewWindow">没有合适的环境模板？点击创建新模板</el-link>
              </div>
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

          <el-tab-pane label="附件上传" name="attachments">
            <el-form-item label="附件文件" prop="files">
              <el-upload ref="uploadRef" action="#" :auto-upload="false" :on-remove="handleRemove" :file-list="fileList"
                multiple>
                <el-button type="primary">选择文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    选择要上传的附件文件，将与任务一同保存
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>

        <div class="form-actions">
          <el-button @click="backToList">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">保存任务</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createTask } from '../../../api/task'
import { getClasses } from '../../../api/class'
import { getEnvironmentTemplates, getEnvironmentTemplatesByType } from '../../../api/environment'
import { ElMessage } from 'element-plus'

const router = useRouter()
const taskFormRef = ref(null)
const uploadRef = ref(null)
const submitting = ref(false)
const activeTab = ref('basic')
const classList = ref([])
const environmentList = ref([])
const fileList = ref([])

const taskForm = reactive({
  title: '',
  description: '',
  max_duration: 60,  // 默认1小时
  max_attempts: 1,
  class_ids: [],
  task_type: 'guacamole', // 默认为远程桌面
  environment_id: null,

  // Guacamole (ECS) 参数
  region_id: 'cn-hangzhou',
  image_id: '',
  instance_type: 'ecs.t5-lc1m1.small',
  security_group_id: '',
  vswitch_id: '',
  internet_max_bandwidth_out: 5,
  spot_strategy: 'SpotAsPriceGo',  // 默认使用竞价实例
  password: '',

  // Jupyter 参数
  jupyter_image: 'jupyter/datascience-notebook:latest',
  memory_limit: 1024, // 默认1GB
  cpu_limit: 1.0,

  // 通用参数
  custom_params_json: '{}'
})

// 仅在选择了环境模板或者自定义时显示环境配置标签页
const showEnvironmentConfig = computed(() => {
  return taskForm.environment_id === 'custom' || (taskForm.task_type && !taskForm.environment_id);
})

const taskRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  task_type: [
    { required: true, message: '请选择任务类型', trigger: 'change' }
  ],
  environment_id: [
    { required: true, message: '请选择环境模板', trigger: 'change' }
  ],
  max_attempts: [
    { required: true, message: '请设置最大尝试次数', trigger: 'blur' },
    { type: 'number', min: 1, message: '最小值为 1', trigger: 'blur' }
  ],
  class_ids: [
    { required: true, message: '请选择至少一个班级', trigger: 'change' },
    { type: 'array', min: 1, message: '请选择至少一个班级', trigger: 'change' }
  ],
  // 条件验证规则，仅当选择了特定任务类型时进行验证
  region_id: [
    {
      required: true, message: '请输入区域ID', trigger: 'blur', validator: (rule, value, callback) => {
        if (taskForm.task_type === 'guacamole' && !taskForm.environment_id && !value) {
          callback(new Error('请输入区域ID'))
        } else {
          callback()
        }
      }
    }
  ],
  // 针对其他字段也添加类似的条件验证规则...
  custom_params_json: [
    { validator: validateJson, trigger: 'blur' }
  ]
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

// 获取环境类型名称
function getEnvironmentTypeName(type) {
  const typeMap = {
    'guacamole': '远程桌面',
    'jupyter': 'Jupyter Notebook'
  }
  return typeMap[type] || type
}

// 处理任务类型变更
function handleTaskTypeChange(value) {
  // 重置环境模板选择
  taskForm.environment_id = null

  // 加载对应类型的环境模板
  fetchEnvironmentTemplates(value)
}

// 处理环境模板变更
function handleEnvironmentChange(value) {
  if (!value) return

  // 如果选择了自定义，切换到环境配置标签页
  // if (value === 'custom') {
  //   activeTab.value = 'environment'
  //   return
  // }

  // 查找选中的环境模板
  const selectedEnv = environmentList.value.find(env => env.id === value)
  if (!selectedEnv) return

  // 根据环境模板预填充表单
  if (selectedEnv.resource_config) {
    const config = selectedEnv.resource_config

    if (taskForm.task_type === 'guacamole') {
      // 填充ECS相关参数
      taskForm.region_id = config.region_id || taskForm.region_id
      taskForm.image_id = selectedEnv.image || taskForm.image_id
      taskForm.instance_type = config.instance_type || taskForm.instance_type
      taskForm.security_group_id = config.security_group_id || taskForm.security_group_id
      taskForm.vswitch_id = config.vswitch_id || taskForm.vswitch_id
      taskForm.internet_max_bandwidth_out = config.internet_max_bandwidth_out || taskForm.internet_max_bandwidth_out
      taskForm.spot_strategy = config.spot_strategy || taskForm.spot_strategy

      // 生成随机密码或使用环境模板中的默认密码
      if (!taskForm.password) {
        taskForm.password = generatePassword()
      }
    } else if (taskForm.task_type === 'jupyter') {
      // 填充Jupyter相关参数
      taskForm.jupyter_image = config.image || taskForm.jupyter_image
      taskForm.memory_limit = config.memory || taskForm.memory_limit
      taskForm.cpu_limit = config.cpu || taskForm.cpu_limit
    }

    // 填充自定义参数
    if (config.custom_params) {
      taskForm.custom_params_json = typeof config.custom_params === 'string'
        ? config.custom_params
        : JSON.stringify(config.custom_params, null, 2)
    }
  }
}

// 生成随机密码
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return 'Rp' + password
}

// 返回列表页
function backToList() {
  router.push('/admin/tasks')
}

// 打开新窗口
function openNewWindow() {
  const newWindow = window.open('/admin/environments/create', 'createEnvTemplate', 'popup');

  if (newWindow) {
    const timer = setInterval(() => {
      if (newWindow.closed) {
        clearInterval(timer);
        fetchEnvironmentTemplates(taskForm.task_type);
      }
    }, 500);
  }
}

// 处理文件移除
function handleRemove(file, fileList) {
  console.log(file, fileList)
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

// 获取环境模板列表
async function fetchEnvironmentTemplates(type = null) {
  try {
    let res
    if (type) {
      res = await getEnvironmentTemplatesByType(type)
    } else {
      res = await getEnvironmentTemplates()
    }
    console.log(res)

    environmentList.value = res || []

  } catch (error) {
    console.error('获取环境模板失败:', error)
    ElMessage.error('获取环境模板失败')
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
        formData.append('task_type', taskForm.task_type)

        if (taskForm.environment_id && taskForm.environment_id !== 'custom') {
          formData.append('environment_id', taskForm.environment_id)
        }

        if (taskForm.description) {
          formData.append('description', taskForm.description)
        }

        if (taskForm.max_duration !== null) {
          formData.append('max_duration', taskForm.max_duration)
        }

        formData.append('max_attempts', taskForm.max_attempts)

        // 根据任务类型添加不同的配置
        if (taskForm.task_type === 'guacamole') {
          // 添加阿里云配置
          formData.append('region_id', taskForm.region_id)
          formData.append('image_id', taskForm.image)
          formData.append('instance_type', taskForm.instance_type)
          formData.append('security_group_id', taskForm.security_group_id)
          formData.append('vswitch_id', taskForm.vswitch_id)
          formData.append('internet_max_bandwidth_out', taskForm.internet_max_bandwidth_out)
          formData.append('spot_strategy', taskForm.spot_strategy)
          formData.append('password', taskForm.password)
        } else if (taskForm.task_type === 'jupyter') {
          // 添加Jupyter配置
          formData.append('jupyter_image', taskForm.image)
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
        await createTask(formData)

        ElMessage.success('任务创建成功')
        router.push('/admin/tasks')
      } catch (error) {
        console.error('保存任务失败:', error)
        ElMessage.error(error.response?.data?.detail || '保存任务失败')
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
  const basicFields = ['title', 'task_type', 'environment_id', 'description', 'max_duration', 'max_attempts', 'class_ids']
  const environmentFields = ['region_id', 'image_id', 'instance_type', 'security_group_id',
    'vswitch_id', 'internet_max_bandwidth_out', 'spot_strategy',
    'password', 'jupyter_image', 'memory_limit', 'cpu_limit', 'custom_params_json']
  const attachmentFields = ['files']

  if (basicFields.includes(fieldName)) return 'basic'
  if (environmentFields.includes(fieldName)) return 'environment'
  if (attachmentFields.includes(fieldName)) return 'attachments'

  return null
}

// 监听任务类型变化，自动获取对应的环境模板
watch(() => taskForm.task_type, (newType) => {
  if (newType) {
    fetchEnvironmentTemplates(newType)
  }
})

onMounted(() => {
  fetchClassList()
  fetchEnvironmentTemplates(taskForm.task_type)
})
</script>

<style scoped>
.task-create-container {
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