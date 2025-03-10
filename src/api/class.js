import request from "../utils/request";

// 获取班级列表
export function getClasses(params) {
  return request({
    url: "/classes/",
    method: "get",
    params,
  });
}

// 获取班级详情
export function getClass(id) {
  return request({
    url: `/classes/${id}`,
    method: "get",
  });
}

// 创建班级
export function createClass(data) {
  return request({
    url: "/classes/",
    method: "post",
    data,
  });
}

// 更新班级
export function updateClass(id, data) {
  return request({
    url: `/classes/${id}`,
    method: "put",
    data,
  });
}

// 删除班级
export function deleteClass(id) {
  return request({
    url: `/classes/${id}`,
    method: "delete",
  });
}
