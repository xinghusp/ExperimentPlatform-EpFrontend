// src/utils/dateUtils.js
export default {
  /**
   * 将UTC时间字符串转换为本地时间显示
   * @param {string|Date} utcTime - UTC时间字符串或Date对象
   * @param {string} format - 格式化字符串，默认 'YYYY-MM-DD HH:mm:ss'
   * @returns {string} 格式化后的本地时间字符串
   */
  formatLocalTime(utcTime, format = "YYYY-MM-DD HH:mm:ss") {
    if (!utcTime) return "-";

    // 确保我们有一个Date对象
    const date = typeof utcTime === "string" ? new Date(utcTime) : utcTime;

    // 获取年月日时分秒
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    // 根据格式返回结果
    return format
      .replace("YYYY", year)
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  },

  /**
   * 计算两个UTC时间之间的持续时间
   * @param {string} startTime - 开始时间 (UTC)
   * @param {string} endTime - 结束时间 (UTC)
   * @returns {string} 格式化的持续时间
   */
  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return "-";

    // 直接使用UTC时间计算差值，避免时区影响
    const start = new Date(startTime);
    const end = new Date(endTime);

    // 计算差值(毫秒)
    const diff = end - start;

    if (diff < 0) return "-";

    // 转换为时分秒
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    return `${hours}h ${minutes}m ${seconds}s`;
  },

  /**
   * 获取当前本地时间
   * @returns {Date} 当前本地时间的Date对象
   */
  getCurrentLocalTime() {
    return new Date();
  },

  /**
   * 将本地时间转换为UTC时间字符串(用于发送到后端)
   * @param {Date} localDate - 本地Date对象
   * @returns {string} UTC时间字符串
   */
  localToUTC(localDate) {
    return localDate.toISOString();
  },
};
