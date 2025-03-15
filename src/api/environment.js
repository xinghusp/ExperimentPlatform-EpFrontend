import request from "../utils/request";

// 获取所有环境模板
export function getEnvironmentTemplates(params) {
  return request({
    url: "/environments/",
    method: "get",
    params,
  });
}

// 根据类型获取环境模板
export function getEnvironmentTemplatesByType(type) {
  return request({
    url: `/environments/?type=${type}`,
    method: "get",
  });
}

// 获取单个环境模板详情
export function getEnvironmentTemplate(id) {
  return request({
    url: `/environments/${id}`,
    method: "get",
  });
}

// 创建环境模板
export function createEnvironmentTemplate(data) {
  return request({
    url: "/environments/",
    method: "post",
    data,
  });
}

// 更新环境模板
export function updateEnvironmentTemplate(id, data) {
  return request({
    url: `/environments/${id}`,
    method: "put",
    data,
  });
}

// 删除环境模板
export function deleteEnvironmentTemplate(id) {
  return request({
    url: `/environments/${id}`,
    method: "delete",
  });
}
