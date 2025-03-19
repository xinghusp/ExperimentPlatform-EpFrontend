import request from "../utils/request";

// 管理端API
// 获取任务列表
export function getTasks(params) {
  return request({
    url: "/tasks/",
    method: "get",
    params,
  });
}

// 获取任务详情
export function getTask(id) {
  return request({
    url: `/tasks/${id}`,
    method: "get",
  });
}

// 创建任务 - 使用FormData上传文件
export function createTask(formData) {
  // 注意：formData 现在应该包含 task_type 和 environment_id
  return request({
    url: "/tasks/",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// 更新任务
export function updateTask(id, data) {
  return request({
    url: `/tasks/${id}`,
    method: "put",
    data,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// 删除任务
export function deleteTask(id) {
  return request({
    url: `/tasks/${id}`,
    method: "delete",
  });
}

// 获取学生任务执行记录
export function getStudentTasks(params) {
  return request({
    url: "/tasks/query-student-tasks/",
    method: "get",
    params,
  });
}

// 强制结束学生任务
export function forceEndStudentTask(id) {
  return request({
    url: `/tasks/student_tasks/${id}/force_end`,
    method: "post",
  });
}

// 学生端API
// 获取学生可执行的任务列表
export function getStudentTaskList(params) {
  return request({
    url: "/tasks/student/list",
    method: "get",
    params,
  });
}

// 开始执行任务
export function startTask(taskId) {
  return request({
    url: `/student/start-experiment/${taskId}`,
    method: "post",
    data: {},
  });
}

// 检查任务状态
export function checkTaskStatus(studentTaskId) {
  return request({
    url: `/tasks/student/${studentTaskId}/status`,
    method: "get",
  });
}

// 更新心跳
export function updateHeartbeat(studentTaskId) {
  return request({
    url: `/student/heartbeat/${studentTaskId}`,
    method: "post",
  });
}

// 结束任务
export function endTask(studentTaskId) {
  return request({
    url: `/student/stop-experiment/${studentTaskId}`,
    method: "post",
  });
}

// 获取学生任务状态
export function getStudentTaskStatus(studentTaskId) {
  return request({
    url: `/tasks/student/${studentTaskId}/status`,
    method: "get",
  });
}

// 获取 Guacamole 临时令牌
export function getGuacamoleToken(studentTaskId) {
  return request({
    url: `/student/${studentTaskId}/guacamole-token`,
    method: "get",
  });
}

// 新增 API - 获取 Jupyter 临时令牌
export function getJupyterToken(studentTaskId) {
  return request({
    url: `/student/${studentTaskId}/jupyter-token`,
    method: "get",
  });
}

// 新增 API - 使用新端点获取学生任务列表（新版API）
export function getStudentExperiments(params) {
  return request({
    url: "/student/tasks",
    method: "get",
    params,
  });
}

// 新增 API - 开始实验（新版API）
export function startExperiment(taskId) {
  return request({
    url: `/student/start-experiment/${taskId}`,
    method: "post",
  });
}

// 新增 API - 获取实验状态（新版API）
export function getExperimentStatus(studentTaskId) {
  return request({
    url: `/student/${studentTaskId}`,
    method: "get",
  });
}

// 新增 API - 结束实验（新版API）
export function endExperiment(studentTaskId) {
  return request({
    url: `/student/${studentTaskId}/end`,
    method: "post",
  });
}
