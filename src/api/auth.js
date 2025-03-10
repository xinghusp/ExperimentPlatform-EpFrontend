import request from '../utils/request'

// 管理员登录
export function login(data) {
  return request({
    url: '/auth/admin/login',
    method: 'post',
    data: {
      username: data.username,
      password: data.password
    }
  })
}

// 注册管理员（如果需要）
export function register(data) {
  return request({
    url: '/auth/admin/register',
    method: 'post',
    data
  })
}