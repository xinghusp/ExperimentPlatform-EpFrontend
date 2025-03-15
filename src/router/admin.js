// 管理员路由配置
export default [
  {
    path: "",
    redirect: "dashboard",
  },
  {
    path: "dashboard",
    component: () => import("../views/admin/Dashboard.vue"),
    meta: { title: "控制台", icon: "Odometer" },
  },
  {
    path: "classes",
    component: () => import("../views/admin/Classes/ClassList.vue"),
    meta: { title: "班级管理", icon: "User" },
  },
  {
    path: "classes/create",
    component: () => import("../views/admin/Classes/ClassCreate.vue"),
    meta: { title: "新增班级", activeMenu: "classes" },
  },
  {
    path: "classes/:id",
    component: () => import("../views/admin/Classes/ClassEdit.vue"),
    meta: { title: "编辑班级", activeMenu: "classes" },
  },
  {
    path: "classes/:id/students",
    component: () => import("../views/admin/Classes/StudentList.vue"),
    meta: { title: "学生列表", activeMenu: "classes" },
  },
  {
    path: "tasks",
    component: () => import("../views/admin/Tasks/TaskList.vue"),
    meta: { title: "任务管理", icon: "Document" },
  },
  {
    path: "tasks/create",
    component: () => import("../views/admin/Tasks/TaskCreate.vue"),
    meta: { title: "新增任务", activeMenu: "tasks" },
  },
  {
    path: "tasks/:id",
    component: () => import("../views/admin/Tasks/TaskEdit.vue"),
    meta: { title: "编辑任务", activeMenu: "tasks" },
  },
  {
    path: "tasks/monitor",
    component: () => import("../views/admin/Tasks/TaskMonitor.vue"),
    meta: { title: "任务监控", icon: "Monitor" },
  },
  {
    path: "environments",
    component: () => import("@/views/admin/Environments/EnvironmentList.vue"),
    name: "EnvironmentList",
    meta: {
      title: "环境模板列表",
      icon: "el-icon-document",
      roles: ["admin"],
    },
  },
  {
    path: "environments/create",
    component: () => import("@/views/admin/Environments/EnvironmentCreate.vue"),
    name: "EnvironmentCreate",
    meta: { title: "创建环境模板", icon: "el-icon-plus", roles: ["admin"] },
    hidden: true,
  },
  {
    path: "environments/:id",
    component: () => import("@/views/admin/Environments/EnvironmentCreate.vue"),
    name: "EnvironmentEdit",
    meta: { title: "编辑环境模板", icon: "el-icon-edit", roles: ["admin"] },
    hidden: true,
  },
];
