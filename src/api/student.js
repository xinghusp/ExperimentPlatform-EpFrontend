import request from "../utils/request";

// 学生登录
export function login(data) {
  return request({
    url: "/auth/student/login",
    method: "post",
    data: {
      student_id: data.student_id,
      name: data.name,
    },
  });
}

// 获取学生列表
export function getStudentsByClass(classId, params) {
  return request({
    url: `/classes/${classId}/students`,
    method: "get",
    params,
  });
}

// 添加单个学生
export function addStudent(classId, data) {
  return request({
    url: `/classes/${classId}/students`,
    method: "post",
    data,
  });
}

// 批量导入学生
export function importStudents(classId, data) {
  return request({
    url: `/classes/${classId}/students/import`,
    method: "post",
    data: {
      class_id: classId,
      students: data,
    },
  });
}

// 删除学生
export function deleteStudent(studentId) {
  return request({
    url: `/classes/students/${studentId}`,
    method: "delete",
  });
}

// 获取学生个人信息
export function getStudentProfile() {
  return request({
    url: `/student/profile`,
    method: "get",
  });
}
