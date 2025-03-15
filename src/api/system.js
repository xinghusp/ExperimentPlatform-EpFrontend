import request from "../utils/request";

// 获取系统状态
export function getSystemStatus() {
  return request({
    url: "/system/status",
    method: "get",
  });
}

// 获取资源使用情况
export function getResourceUsage() {
  return request({
    url: "/system/resources",
    method: "get",
  });
}

// 获取实验环境统计
export function getEnvironmentStatistics() {
  return request({
    url: "/system/environment-stats",
    method: "get",
  });
}
