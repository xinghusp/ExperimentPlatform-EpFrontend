# 构建阶段
FROM node:20-slim as build-stage

# 设置工作目录
WORKDIR /app

# 配置npm使用阿里云镜像
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 生产阶段
FROM nginx:stable-alpine as production-stage

# 将构建好的文件复制到nginx目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 使用sed启用gzip和设置相关配置
RUN sed -i '/http {/a \    gzip on;\n    gzip_vary on;\n    gzip_proxied any;\n    gzip_comp_level 6;\n    gzip_buffers 16 8k;\n    gzip_http_version 1.1;\n    gzip_min_length 256;\n    gzip_types application/javascript application/json application/xml application/xml+rss text/css text/javascript text/plain text/xml image/svg+xml;' /etc/nginx/nginx.conf

# 添加SPA单页应用重定向配置
RUN sed -i 's/location \/ {/location \/ {\n        try_files $uri $uri\/ \/index.html;/' /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]