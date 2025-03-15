<template>
    <div class="environment-list-container">
        <div class="page-header">
            <h2>环境模板管理</h2>
            <el-button type="primary" @click="handleCreateEnvironment">
                创建模板
            </el-button>
        </div>

        <el-card class="filter-card">
            <el-form :inline="true" :model="filterForm" @submit.prevent="applyFilter">
                <el-form-item label="模板类型">
                    <el-select v-model="filterForm.type" placeholder="选择类型" clearable style="width: 200px;">
                        <el-option label="远程桌面" value="guacamole" />
                        <el-option label="Jupyter" value="jupyter" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="applyFilter">筛选</el-button>
                    <el-button @click="resetFilter">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card>
            <el-table :data="environmentList" stripe style="width: 100%" v-loading="loading">
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="模板名称" />
                <el-table-column label="类型" width="120">
                    <template #default="scope">
                        <el-tag :type="getTypeTag(scope.row.type)">
                            {{ getTypeName(scope.row.type) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="资源配置" width="200">
                    <template #default="scope">
                        <div v-if="scope.row.type === 'guacamole'">
                            <div>{{ scope.row.resource_config?.instance_type || '-' }}</div>
                            <div>{{ scope.row.resource_config?.region_id || '-' }}</div>
                        </div>
                        <div v-else-if="scope.row.type === 'jupyter'">
                            <div>内存: {{ formatMemory(scope.row.resource_config?.memory) }}</div>
                            <div>CPU: {{ scope.row.resource_config?.cpu || '-' }} 核</div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" width="180">
                    <template #default="scope">
                        {{ formatDate(scope.row.created_at) }}
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" />
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleEditEnvironment(scope.row)">
                            编辑
                        </el-button>
                        <el-button type="danger" size="small" @click="handleDeleteEnvironment(scope.row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getEnvironmentTemplates, deleteEnvironmentTemplate } from '../../../api/environment'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const environmentList = ref([])

const filterForm = reactive({
    type: ''
})

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString()
}

// 格式化内存显示
const formatMemory = (memory) => {
    if (!memory) return '-'
    if (memory < 1024) return `${memory}MB`
    return `${(memory / 1024).toFixed(1)}GB`
}

// 获取类型名称
const getTypeName = (type) => {
    const typeMap = {
        'guacamole': '远程桌面',
        'jupyter': 'Jupyter'
    }
    return typeMap[type] || type
}

// 获取类型标签样式
const getTypeTag = (type) => {
    const tagMap = {
        'guacamole': 'success',
        'jupyter': 'primary'
    }
    return tagMap[type] || ''
}

// 获取环境模板列表
const fetchEnvironmentList = async () => {
    try {
        loading.value = true

        // 构建查询参数
        const params = {}
        if (filterForm.type) {
            params.type = filterForm.type
        }

        const res = await getEnvironmentTemplates(params)
        environmentList.value = res || []
    } catch (error) {
        console.error('获取环境模板列表失败:', error)
        ElMessage.error('获取环境模板列表失败')
    } finally {
        loading.value = false
    }
}

// 应用筛选
const applyFilter = () => {
    fetchEnvironmentList()
}

// 重置筛选
const resetFilter = () => {
    filterForm.type = ''
    fetchEnvironmentList()
}

// 创建环境模板
const handleCreateEnvironment = () => {
    router.push('/admin/environments/create')
}

// 编辑环境模板
const handleEditEnvironment = (row) => {
    router.push(`/admin/environments/${row.id}`)
}

// 删除环境模板
const handleDeleteEnvironment = async (row) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除环境模板 "${row.name}" 吗？此操作不可恢复。`,
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        await deleteEnvironmentTemplate(row.id)
        ElMessage.success('删除成功')

        // 刷新列表
        fetchEnvironmentList()
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

onMounted(() => {
    fetchEnvironmentList()
})
</script>

<style scoped>
.environment-list-container {
    padding: 10px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.filter-card {
    margin-bottom: 20px;
}
</style>