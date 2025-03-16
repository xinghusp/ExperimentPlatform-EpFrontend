import component from "element-plus/es/components/tree-select/src/tree-select-option.mjs";

// 学生路由配置
export default [
  {
    path: "",
    redirect: "dashboard",
  },
  {
    path: "dashboard",
    component: () => import("../views/student/Dashboard.vue"),
    meta: { title: "我的实验", icon: "HomeFilled" },
  },
  {
    path: "experiment/:id",
    component: () => import("../views/student/Experiment.vue"),
    meta: { title: "实验环境", activeMenu: "dashboard" },
  },
];
