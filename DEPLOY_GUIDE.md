# AI客服系统 Cloud Run 部署指南

## 前提条件

1. 已安装并配置 Google Cloud SDK
2. 已有 Google Cloud 项目并启用以下 API：
   - Cloud Run API
   - Container Registry API 或 Artifact Registry API
   - Cloud Build API (可选)

## 步骤1: 准备环境变量

在 Cloud Run 服务中需要设置以下环境变量：

```bash
# 必需的环境变量
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_BUCKET_NAME=your-bucket-name
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=your-location
```

## 步骤2: 构建和推送镜像

### 方法1: 使用 Docker 手动构建

```bash
# 1. 设置项目变量
export PROJECT_ID="your-project-id"
export SERVICE_NAME="ai-customer-service"
export REGION="asia-east1"  # 或其他区域

# 2. 构建镜像
docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME} .

# 3. 推送到 Container Registry
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}
```

### 方法2: 使用 Cloud Build (推荐)

```bash
# 使用 Cloud Build 自动构建
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}
```

## 步骤3: 部署到 Cloud Run

### 新部署 (第一次)

```bash
gcloud run deploy ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --set-env-vars "DATABASE_URL=your-database-url,SUPABASE_URL=your-supabase-url,SUPABASE_SERVICE_KEY=your-service-key,SUPABASE_BUCKET_NAME=your-bucket-name,GOOGLE_CLOUD_PROJECT_ID=your-project-id,GOOGLE_CLOUD_LOCATION=your-location"
```

### 更新现有服务

```bash
# 如果服务已存在，直接更新镜像
gcloud run services update ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
    --region ${REGION}
```

## 步骤4: 配置环境变量 (推荐在控制台操作)

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 导航到 Cloud Run
3. 找到你的服务并点击进入
4. 点击 "编辑和部署新版本"
5. 在 "变量和密钥" 标签页添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `DATABASE_URL` | 你的 PostgreSQL 数据库连接字符串 |
| `SUPABASE_URL` | 你的 Supabase 项目 URL |
| `SUPABASE_SERVICE_KEY` | 你的 Supabase 服务密钥 |
| `SUPABASE_BUCKET_NAME` | 你的 Supabase 存储桶名称 |
| `GOOGLE_CLOUD_PROJECT_ID` | 你的 Google Cloud 项目 ID |
| `GOOGLE_CLOUD_LOCATION` | 你的 Google Cloud 区域 |

## 步骤5: 验证部署

```bash
# 获取服务 URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')
echo "服务 URL: ${SERVICE_URL}"

# 测试健康检查
curl ${SERVICE_URL}/health

# 应该返回: {"status":"healthy","service":"unified_ai_customer_service"}
```

## 常用命令

### 查看日志
```bash
gcloud logs read --service=${SERVICE_NAME} --region=${REGION}
```

### 查看服务状态
```bash
gcloud run services describe ${SERVICE_NAME} --region=${REGION}
```

### 删除服务
```bash
gcloud run services delete ${SERVICE_NAME} --region=${REGION}
```

## 故障排除

### 1. 容器启动失败
- 检查日志: `gcloud logs read --service=${SERVICE_NAME}`
- 确认环境变量是否正确设置
- 确认数据库连接是否可用

### 2. 内存不足
- 增加内存限制: `--memory 4Gi`

### 3. 超时问题  
- 增加超时时间: `--timeout 600`

### 4. 数据库连接问题
- 确认 DATABASE_URL 格式正确
- 检查数据库是否允许 Cloud Run 的 IP 访问
- 考虑使用 Cloud SQL Proxy

## 自动化部署

你可以使用提供的 `deploy.sh` 脚本：

1. 修改脚本中的项目配置
2. 运行: `./deploy.sh`

## 注意事项

1. **费用**: Cloud Run 按使用量计费，建议设置最大实例数
2. **安全**: 生产环境建议启用身份验证
3. **监控**: 设置告警和监控规则
4. **备份**: 定期备份数据库
5. **SSL**: Cloud Run 默认提供 HTTPS 