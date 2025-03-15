<template>
    <div class="environment-create-container">
        <div class="page-header">
            <h2>{{ isEdit ? '编辑环境模板' : '创建环境模板' }}</h2>
            <el-button @click="backToList">返回列表</el-button>
        </div>

        <el-card v-loading="loading">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="180px" label-position="left">
                <el-form-item label="模板名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入环境模板名称" />
                </el-form-item>

                <el-form-item label="模板类型" prop="type">
                    <el-select v-model="form.type" placeholder="请选择模板类型" @change="handleTypeChange" style="width: 100%"
                        :disabled="isEdit">
                        <el-option label="远程桌面环境 (Guacamole)" value="guacamole" />
                        <el-option label="Jupyter Notebook环境" value="jupyter" />
                    </el-select>
                    <div class="form-tip" v-if="isEdit">模板类型创建后不可更改</div>
                </el-form-item>

                <el-form-item label="描述" prop="description">
                    <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入环境模板描述" />
                </el-form-item>

                <template v-if="form.type === 'guacamole'">
                    <h3>远程桌面环境配置</h3>

                    <el-form-item label="区域" prop="region_id">
                        <el-input v-model="form.region_id" placeholder="例如：cn-hangzhou" />
                    </el-form-item>

                    <el-form-item label="镜像ID" prop="image">
                        <el-input v-model="form.image" placeholder="例如：m-bp1g7004ksh0oeuco0eo" />
                    </el-form-item>

                    <el-form-item label="实例类型" prop="instance_type">
                        <el-input v-model="form.instance_type" placeholder="例如：ecs.t5-lc1m1.small" />
                    </el-form-item>

                    <el-form-item label="安全组ID" prop="security_group_id">
                        <el-input v-model="form.security_group_id" placeholder="例如：sg-bp1fvzkj690y0cruek6d" />
                    </el-form-item>

                    <el-form-item label="交换机ID" prop="vswitch_id">
                        <el-input v-model="form.vswitch_id" placeholder="例如：vsw-bp1ddbrxdlrcbim46z8p2" />
                    </el-form-item>

                    <el-form-item label="出网带宽(Mbps)" prop="internet_max_bandwidth_out">
                        <el-input-number v-model="form.internet_max_bandwidth_out" :min="0" :max="100" />
                    </el-form-item>

                    <el-form-item label="竞价策略" prop="spot_strategy">
                        <el-select v-model="form.spot_strategy" placeholder="请选择竞价策略" style="width: 100%">
                            <el-option label="不使用竞价实例" value="NoSpot" />
                            <el-option label="设置上限价格" value="SpotWithPriceLimit" />
                            <el-option label="系统自动出价" value="SpotAsPriceGo" />
                        </el-select>
                    </el-form-item>
                </template>

                <template v-if="form.type === 'jupyter'">
                    <h3>Jupyter环境配置</h3>

                    <el-form-item label="Jupyter镜像" prop="image">
                        <el-input v-model="form.image" placeholder="例如: jupyter/datascience-notebook:latest" />
                        <div class="form-tip">
                            Docker Hub上的Jupyter镜像名称，如不确定请使用默认值
                        </div>
                    </el-form-item>

                    <el-form-item label="内存限制" prop="memory_limit">
                        <el-input-number v-model="form.memory_limit" :min="512" :step="256" :max="8192" />
                        <span class="unit-label">MB</span>
                        <div class="form-tip">
                            容器可使用的最大内存
                        </div>
                    </el-form-item>

                    <el-form-item label="CPU限制" prop="cpu_limit">
                        <el-input-number v-model="form.cpu_limit" :min="0.1" :step="0.1" :max="4" :precision="1" />
                        <span class="unit-label">核</span>
                        <div class="form-tip">
                            容器可使用的最大CPU核数
                        </div>
                    </el-form-item>
                </template>

                <el-form-item label="自定义参数" prop="custom_params_json">
                    <el-input v-model="form.custom_params_json" type="textarea" :rows="5"
                        placeholder="JSON格式的自定义参数(可选)" />
                </el-form-item>

                <div class="form-actions">
                    <el-button @click="backToList">取消</el-button>
                    <el-button type="primary" :loading="submitting" @click="submitForm">
                        {{ isEdit ? '保存修改' : '创建模板' }}
                    </el-button>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createEnvironmentTemplate, getEnvironmentTemplate, updateEnvironmentTemplate } from '../../../api/environment'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const submitting = ref(false)
const loading = ref(false)

// 判断是否为编辑模式
const isEdit = computed(() => {
    return route.params.id !== undefined
})

const form = reactive({
    name: '',
    type: 'guacamole',  // 默认为远程桌面
    description: '',
    image: '',

    // Guacamole (ECS) 参数
    region_id: 'cn-hangzhou',
    instance_type: 'ecs.t5-lc1m1.small',
    security_group_id: '',
    vswitch_id: '',
    internet_max_bandwidth_out: 5,
    spot_strategy: 'SpotAsPriceGo',

    // Jupyter 参数
    memory_limit: 1024,
    cpu_limit: 1.0,

    // 通用参数
    custom_params_json: '{}'
})

const rules = {
    name: [
        { required: true, message: '请输入模板名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    type: [
        { required: true, message: '请选择模板类型', trigger: 'change' }
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

// 处理类型变更
function handleTypeChange() {
    // 可以在这里添加类型变更后的逻辑
}

// 返回列表页
function backToList() {
    router.push('/admin/environments')
}

// 获取环境模板详情（编辑模式）
async function fetchEnvironmentTemplate() {
    if (!isEdit.value) return

    try {
        loading.value = true
        const templateId = route.params.id
        const res = await getEnvironmentTemplate(templateId)

        // 更新表单数据
        form.name = res.name
        form.type = res.type
        form.description = res.description || ''

        // 根据模板类型设置相应字段
        if (res.resource_config) {
            const config = res.resource_config

            if (form.type === 'guacamole') {
                form.region_id = config.region_id || 'cn-hangzhou'
                form.image = res.image || ''
                form.instance_type = config.instance_type || 'ecs.t5-lc1m1.small'
                form.security_group_id = config.security_group_id || ''
                form.vswitch_id = config.vswitch_id || ''
                form.internet_max_bandwidth_out = config.internet_max_bandwidth_out || 5
                form.spot_strategy = config.spot_strategy || 'SpotAsPriceGo'
            } else if (form.type === 'jupyter') {
                form.image = res.image || 'jupyter/datascience-notebook:latest'
                form.memory_limit = config.memory || 1024
                form.cpu_limit = config.cpu || 1.0
            }

            // 处理自定义参数
            if (config.custom_params) {
                if (typeof config.custom_params === 'string') {
                    form.custom_params_json = config.custom_params
                } else {
                    form.custom_params_json = JSON.stringify(config.custom_params, null, 2)
                }
            }
        }
    } catch (error) {
        console.error('获取环境模板信息失败:', error)
        ElMessage.error('获取环境模板信息失败')
        router.push('/admin/environments')
    } finally {
        loading.value = false
    }
}

// 提交表单
async function submitForm() {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            try {
                submitting.value = true

                const resourceConfig = {}

                // 根据模板类型构建资源配置
                if (form.type === 'guacamole') {
                    Object.assign(resourceConfig, {
                        region_id: form.region_id,
                        image_id: form.image,
                        instance_type: form.instance_type,
                        security_group_id: form.security_group_id,
                        vswitch_id: form.vswitch_id,
                        internet_max_bandwidth_out: form.internet_max_bandwidth_out,
                        spot_strategy: form.spot_strategy
                    })
                } else if (form.type === 'jupyter') {
                    Object.assign(resourceConfig, {
                        image: form.image,
                        memory: form.memory_limit,
                        cpu: form.cpu_limit
                    })
                }

                // 添加自定义参数
                if (form.custom_params_json && form.custom_params_json !== '{}') {
                    try {
                        resourceConfig.custom_params = JSON.parse(form.custom_params_json)
                    } catch (e) {
                        // 解析失败则作为字符串保存
                        resourceConfig.custom_params = form.custom_params_json
                    }
                }

                const templateData = {
                    name: form.name,
                    type: form.type,
                    image: form.image,
                    description: form.description,
                    resource_config: resourceConfig
                }

                // 根据是否编辑模式决定API调用
                if (isEdit.value) {
                    await updateEnvironmentTemplate(route.params.id, templateData)
                    ElMessage.success('环境模板更新成功')
                } else {
                    await createEnvironmentTemplate(templateData)
                    ElMessage.success('环境模板创建成功')
                }

                router.push('/admin/environments')
            } catch (error) {
                console.error(isEdit.value ? '更新环境模板失败:' : '创建环境模板失败:', error)
                ElMessage.error((isEdit.value ? '更新' : '创建') + '环境模板失败: ' + (error.response?.data?.detail || error.message))
            } finally {
                submitting.value = false
            }
        } else {
            ElMessage.warning('请完善表单信息')
            return false
        }
    })
}

// 组件挂载时加载数据
onMounted(() => {
    if (isEdit.value) {
        fetchEnvironmentTemplate()
    }
})
</script>

<style scoped>
.environment-create-container {
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

h3 {
    margin-top: 20px;
    margin-bottom: 20px;
    font-weight: 600;
    color: #606266;
}
</style>