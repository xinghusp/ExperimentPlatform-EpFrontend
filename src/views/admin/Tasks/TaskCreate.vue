<template>
  <div class="task-create-container">
    <div class="page-header">
      <h2>创建新任务</h2>
      <el-button @click="backToList">返回列表</el-button>
    </div>
    
    <el-card>
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskRules"
        label-width="180px"
        label-position="left"
      >
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="任务标题" prop="title">
              <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
            </el-form-item>
            
            <el-form-item label="任务描述" prop="description">
              <el-input
                v-model="taskForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入任务描述"
              />
            </el-form-item>
            
            <el-form-item label="最大实验时长(分钟)" prop="max_duration">
              <el-input-number v-model="taskForm.max_duration" :min="0" placeholder="不填则无时间限制" />
            </el-form-item>
            
            <el-form-item label="最大尝试次数" prop="max_attempts">
              <el-input-number v-model="taskForm.max_attempts" :min="1" :max="10" />
            </el-form-item>
            
            <el-form-item label="分配班级" prop="class_ids">
              <el-select
                v-model="taskForm.class_ids"
                multiple
                placeholder="请选择分配班级"
                style="width: 100%"
              >
                <el-option
                  v-for="item in classList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="阿里云配置" name="aliyun">
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
            
            <el-form-item label="自定义参数" prop="custom_params">
              <el-input
                v-model="taskForm.custom_params_json"
                type="textarea"
                :rows="5"
                placeholder="JSON格式的自定义参数(可选)"
              />
            </el-form-item>
          </el-tab-pane>
          
          <el-tab-pane label="附件上传" name="attachments">
            <el-form-item label="附件文件" prop="files">
              <el-upload
                ref="uploadRef"
                action="#"
                :auto-upload="false"
                :on-remove="handleRemove"
                :file-list="fileList"
                multiple
              >
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createTask } from '../../../api/task'
import { getClasses } from '../../../api/class'
import { ElMessage } from 'element-plus'

const router = useRouter()
const taskFormRef = ref(null)
const uploadRef = ref(null)
const submitting = ref(false)
const activeTab = ref('basic')
const classList = ref([])
const fileList = ref([])

const taskForm = reactive({
  title: '',
  description: '',
  max_duration: null,
  max_attempts: 1,
  class_ids: [],
  region_id: 'cn-hangzhou',
  image_id: '',
  instance_type: 'ecs.t5-lc1m1.small',
  security_group_id: '',
  vswitch_id: '',
  internet_max_bandwidth_out: 5,
  spot_strategy: 'NoSpot',
  password: '',
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
  region_id: [
    { required: true, message: '请输入区域ID', trigger: 'blur' }
  ],
  image_id: [
    { required: true, message: '请输入镜像ID', trigger: 'blur' }
  ],
  instance_type: [
    { required: true, message: '请输入实例类型', trigger: 'blur' }
  ],
  security_group_id: [
    { required: true, message: '请输入安全组ID', trigger: 'blur' }
  ],
  vswitch_id: [
    { required: true, message: '请输入交换机ID', trigger: 'blur' }
  ],
  internet_max_bandwidth_out: [
    { required: true, message: '请设置出网带宽', trigger: 'blur' },
    { type: 'number', min: 0, message: '最小值为 0', trigger: 'blur' }
  ],
  spot_strategy: [
    { required: true, message: '请选择竞价策略', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请设置实例密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能小于8个字符', trigger: 'blur' }
  ],
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

// 返回列表页
function backToList() {
  router.push('/admin/tasks')
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
        
        // 添加阿里云配置
        formData.append('region_id', taskForm.region_id)
        formData.append('image_id', taskForm.image_id)
        formData.append('instance_type', taskForm.instance_type)
        formData.append('security_group_id', taskForm.security_group_id)
        formData.append('vswitch_id', taskForm.vswitch_id)
        formData.append('internet_max_bandwidth_out', taskForm.internet_max_bandwidth_out)
        formData.append('spot_strategy', taskForm.spot_strategy)
        formData.append('password', taskForm.password)
        
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
        const res = await createTask(formData)
        
        ElMessage.success('任务创建成功')
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
  const aliyunFields = ['region_id', 'image_id', 'instance_type', 'security_group_id', 
                      'vswitch_id', 'internet_max_bandwidth_out', 'spot_strategy', 
                      'password', 'custom_params_json']
  const attachmentFields = ['files']
  
  if (basicFields.includes(fieldName)) return 'basic'
  if (aliyunFields.includes(fieldName)) return 'aliyun'
  if (attachmentFields.includes(fieldName)) return 'attachments'
  
  return null
}

onMounted(() => {
  fetchClassList()
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
</style>