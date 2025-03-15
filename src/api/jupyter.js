import request from "../utils/request";

// 获取 Jupyter 实例信息
export function getJupyterInstance(studentTaskId) {
  return request({
    url: `/student/${studentTaskId}/jupyter`,
    method: "get",
  });
}

// 获取 Jupyter 文件列表
export function getJupyterFiles(studentTaskId, path = "") {
  return request({
    url: `/student/${studentTaskId}/jupyter/files`,
    method: "get",
    params: { path },
  });
}

// 上传文件到 Jupyter
export function uploadJupyterFile(studentTaskId, formData) {
  return request({
    url: `/student/${studentTaskId}/jupyter/upload`,
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// 下载 Jupyter 文件
export function downloadJupyterFile(studentTaskId, path) {
  return request({
    url: `/student/${studentTaskId}/jupyter/download`,
    method: "get",
    params: { path },
    responseType: "blob",
  });
}
