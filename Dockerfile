# 使用Python 3.11官方镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY ai_customer_service/ ./ai_customer_service/
COPY business_api_server.py .
COPY database_schema.sql .

# 设置工作目录到ai_customer_service
WORKDIR /app/ai_customer_service

# 暴露端口
EXPOSE 8080

# 启动命令 - Cloud Run默认使用8080端口
ENV PORT=8080
CMD ["python", "api_server.py"] 