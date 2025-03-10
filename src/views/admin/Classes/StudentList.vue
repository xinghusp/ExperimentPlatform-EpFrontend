<template>
  <div class="student-list-container">
    <div class="page-header">
      <div class="header-left">
        <h2>{{ className }} - 学生列表</h2>
        <el-tag type="success" effect="plain" class="student-count">
          共 {{ total }} 名学生
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button @click="backToClasses">
          返回班级列表
        </el-button>
        <el-button type="primary" @click="openAddDialog">
          添加学生
        </el-button>
        <el-button type="success" @click="openImportDialog">
          批量导入
        </el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="studentList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="student_id" label="学号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="danger" size="small" @click="handleDeleteStudent(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          background layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 添加学生对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加学生" width="500px">
      <el-form ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="80px">
        <el-form-item label="学号" prop="student_id">
          <el-input v-model="addForm.student_id" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitAddForm">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入学生" width="500px">
      <div class="import-tip">
        <p>1. 请按照以下格式输入学生信息，每行一个学生</p>
        <p>2. 格式：学号,姓名</p>
        <p>3. 示例：</p>
        <pre>
      2023001,张三
      2023002,李四
      2023003,王五
    </pre>
      </div>
      <el-form ref="importFormRef" :model="importForm" :rules="importFormRules" label-width="0">
        <el-form-item prop="students">
          <el-input v-model="importForm.students" type="textarea" :rows="10" placeholder="请按照上述格式输入学生信息，每行一个学生" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitImportForm">
            确认导入
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getStudentsByClass, addStudent, importStudents, deleteStudent } from '../../../api/student'
import { getClass } from '../../../api/class'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const classId = parseInt(route.params.id)
const loading = ref(false)
const submitting = ref(false)
const studentList = ref([])
const className = ref('')
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 添加学生
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = reactive({
  student_id: '',
  name: ''
})
const addFormRules = {
  student_id: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 批量导入
const importDialogVisible = ref(false)
const importFormRef = ref(null)
const importForm = reactive({
  students: ''
})
const importFormRules = {
  students: [
    { required: true, message: '请输入学生信息', trigger: 'blur' }
  ]
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 返回班级列表
function backToClasses() {
  router.push('/admin/classes')
}

// 获取班级信息
async function fetchClassInfo() {
  try {
    const res = await getClass(classId)
    className.value = res.name
  } catch (error) {
    console.error('获取班级信息失败:', error)
    ElMessage.error('获取班级信息失败')
  }
}

// 获取学生列表
async function fetchStudentList() {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: pageSize.value
    }
    const res = await getStudentsByClass(classId, params)
    studentList.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.error('获取学生列表失败')
  } finally {
    loading.value = false
  }
}

// 处理分页大小变化
function handleSizeChange(val) {
  pageSize.value = val
  fetchStudentList()
}

// 处理页码变化
function handleCurrentChange(val) {
  currentPage.value = val
  fetchStudentList()
}

// 打开添加对话框
function openAddDialog() {
  addDialogVisible.value = true
  addForm.student_id = ''
  addForm.name = ''
}

// 打开导入对话框
function openImportDialog() {
  importDialogVisible.value = true
  importForm.students = ''
}

// 提交添加表单
async function submitAddForm() {
  if (!addFormRef.value) return

  await addFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true

        await addStudent(classId, {
          student_id: addForm.student_id,
          name: addForm.name,
          class_id: classId
        })

        ElMessage.success('添加学生成功')
        addDialogVisible.value = false
        fetchStudentList()
      } catch (error) {
        console.error('添加学生失败:', error)
        ElMessage.error('添加学生失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 提交导入表单
async function submitImportForm() {
  if (!importFormRef.value) return

  await importFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true

        // 解析学生数据
        const lines = importForm.students.trim().split('\n')
        const students = []

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const parts = line.split(',')
          if (parts.length !== 2) {
            ElMessage.error(`第 ${i + 1} 行格式错误，请检查`)
            submitting.value = false
            return
          }

          students.push({
            student_id: parts[0].trim(),
            name: parts[1].trim()
          })
        }

        if (students.length === 0) {
          ElMessage.warning('没有有效的学生数据')
          submitting.value = false
          return
        }

        await importStudents(classId, students)

        ElMessage.success(`成功导入 ${students.length} 名学生`)
        importDialogVisible.value = false
        fetchStudentList()
      } catch (error) {
        console.error('导入学生失败:', error)
        ElMessage.error('导入学生失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 删除学生
async function handleDeleteStudent(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除学生 "${row.name}" 吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 调用删除API
    await deleteStudent(row.id)
    ElMessage.success('删除成功')
    fetchStudentList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除学生失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchClassInfo()
  fetchStudentList()
})
</script>

<style scoped>
.student-list-container {
  padding: 10px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.student-count {
  margin-left: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.import-tip {
  margin-bottom: 15px;
}

.import-tip pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin: 5px 0;
  font-family: monospace;
}
</style>