import axios from "axios";
import { ElMessage } from "element-plus";

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1", // 从环境变量获取API URL
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 如果是下载文件，直接返回响应
    if (response.config.responseType === "blob") {
      return response;
    }

    return response.data;
  },
  (error) => {
    // 处理HTTP错误
    let message = "请求失败";

    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 400:
          message = error.response.data?.detail || "请求参数错误";
          break;
        case 401:
          message = "未登录或登录已过期";
          // 清除token并跳转到登录页
          localStorage.removeItem("token");
          localStorage.removeItem("userInfo");
          if (
            location.pathname !== "/admin/login" &&
            location.pathname !== "/student/login"
          ) {
            location.href = "/admin/login";
          }
          break;
        case 403:
          message = "没有操作权限";
          break;
        case 404:
          message = "请求的资源不存在";
          break;
        case 500:
          message = "服务器错误，请联系管理员";
          break;
        default:
          message = `请求错误 (${status})`;
      }
    } else if (error.request) {
      message = "服务器无响应";
    }

    ElMessage.error(message);
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default request;
