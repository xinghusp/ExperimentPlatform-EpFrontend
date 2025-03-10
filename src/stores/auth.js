import { defineStore } from "pinia";
import { login as adminLogin } from "../api/auth";
import { login as studentLogin } from "../api/student";
import router from "../router";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    userInfo: JSON.parse(localStorage.getItem("userInfo") || "null"),
  }),

  getters: {
    isAdmin: (state) => state.userInfo?.role === "admin",
    isStudent: (state) => state.userInfo?.role === "student",
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || state.userInfo?.name || "",
  },

  actions: {
    async login(credentials, role = "admin") {
      try {
        // 根据角色选择不同的登录API
        const response =
          role === "admin"
            ? await adminLogin(credentials)
            : await studentLogin(credentials);

        // 保存认证信息
        console.log(response);
        this.setAuth(response);

        // 导航到相应的首页
        router.push(
          role === "admin" ? "/admin/dashboard" : "/student/dashboard"
        );

        return response;
      } catch (error) {
        console.error("登录失败:", error);
        throw error;
      }
    },

    setAuth(authData) {
      this.token = authData.access_token;
      this.userInfo = {
        id: authData.user_id,
        role: authData.role,
        username: authData.username || authData.student_id,
        name: authData.name,
      };

      // 持久化存储
      localStorage.setItem("token", this.token);
      localStorage.setItem("userInfo", JSON.stringify(this.userInfo));
    },

    logout() {
      // 清除认证信息
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");

      // 返回登录页
      if (this.userInfo?.role === "admin") {
        router.push("/admin/login");
      } else {
        router.push("/student/login");
      }
    },
  },
});
