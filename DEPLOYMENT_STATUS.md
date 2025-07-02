# AI客服系统 Cloud Run 部署状态

## 📋 服务配置

### 当前生产环境URL：
- **🔧 后端API**: https://ai-customer-service-backend-1078006235469.us-central1.run.app
- **📊 商家仪表板**: https://dashboard-app-1078006235469.us-central1.run.app  
- **💬 用户聊天UI**: https://ai-customer-service-chat-ui-1078006235469.us-central1.run.app

### 项目配置：
- **项目ID**: `confident-coder-462218-j2`
- **区域**: `us-central1`
- **容器注册表**: `gcr.io`

## 🚀 部署选项

### 1. 一键部署所有服务
```bash
./deploy_all_services.sh
```
- 自动按顺序部署：后端 → 前端服务（并行）
- 包含健康检查和服务验证
- 自动配置服务间连接

### 2. 单独部署服务

#### 部署后端
```bash
./deploy_backend.sh
```

#### 部署仪表板
```bash
./deploy_dashboard.sh
```

#### 部署聊天UI
```bash
./deploy_chatui.sh
```

### 3. 快速重新部署后端
```bash
./quick_deploy.sh
```

## 🔗 服务间连接配置

### 后端 → 数据库
- `DATABASE_URL`: PostgreSQL/Supabase连接
- `SUPABASE_URL`: Supabase项目URL
- `SUPABASE_SERVICE_KEY`: 服务密钥

### 前端 → 后端
- **仪表板**: `BACKEND_API_URL` 环境变量
- **聊天UI**: `NEXT_PUBLIC_API_URL` 环境变量
- 两者都指向: `https://ai-customer-service-backend-1078006235469.us-central1.run.app`

## 📦 Docker配置

### 后端 (Dockerfile)
- 基于 `python:3.11-slim`
- 端口: 8080 (Cloud Run标准)
- 内存: 2Gi, CPU: 2核
- 包含完整的multi-agent AI功能

### 仪表板 (frontend/ashboard-project-main/Dockerfile)
- 基于 `node:18-alpine`
- Next.js standalone构建
- 端口: 3000
- 内存: 1Gi, CPU: 1核

### 聊天UI (frontend/UI/Dockerfile)  
- 基于 `node:18-alpine`
- Next.js standalone构建
- 端口: 3000
- 内存: 1Gi, CPU: 1核

## 🔧 环境变量配置

### 后端必需变量
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
SUPABASE_BUCKET_NAME=...
GOOGLE_CLOUD_PROJECT_ID=confident-coder-462218-j2
GOOGLE_CLOUD_LOCATION=us-central1
PORT=8080
```

### 前端必需变量
```bash
# 仪表板
BACKEND_API_URL=https://ai-customer-service-backend-1078006235469.us-central1.run.app

# 聊天UI
NEXT_PUBLIC_API_URL=https://ai-customer-service-backend-1078006235469.us-central1.run.app
```

## 🏗️ 构建流程

1. **后端构建**:
   ```bash
   gcloud builds submit --tag gcr.io/confident-coder-462218-j2/ai-customer-service-backend .
   ```

2. **仪表板构建**:
   ```bash
   cd frontend/ashboard-project-main
   gcloud builds submit --tag gcr.io/confident-coder-462218-j2/dashboard-app \
       --build-arg NEXT_PUBLIC_API_BASE_URL=https://ai-customer-service-backend-1078006235469.us-central1.run.app .
   ```

3. **聊天UI构建**:
   ```bash
   cd frontend/UI
   gcloud builds submit --tag gcr.io/confident-coder-462218-j2/ai-customer-service-chat-ui \
       --build-arg NEXT_PUBLIC_API_URL=https://ai-customer-service-backend-1078006235469.us-central1.run.app .
   ```

## ✅ 验证部署

### 健康检查
```bash
# 后端
curl https://ai-customer-service-backend-1078006235469.us-central1.run.app/health

# 预期响应
{"status":"healthy","service":"unified_ai_customer_service"}
```

### API测试
```bash
# 测试客户列表
curl https://ai-customer-service-backend-1078006235469.us-central1.run.app/api/customers

# 测试AI对话
curl -X POST https://ai-customer-service-backend-1078006235469.us-central1.run.app/run \
  -H "Content-Type: application/json" \
  -d '{"appName":"ai_customer_service","userId":"test","sessionId":"123","newMessage":{"role":"user","parts":[{"text":"hello"}]}}'
```

## 🔍 故障排除

### 查看日志
```bash
# 后端日志
gcloud logs read --service=ai-customer-service-backend --region=us-central1 --limit=50

# 仪表板日志  
gcloud logs read --service=dashboard-app --region=us-central1 --limit=50

# 聊天UI日志
gcloud logs read --service=ai-customer-service-chat-ui --region=us-central1 --limit=50
```

### 常见问题
1. **环境变量未设置**: 在Cloud Run控制台检查环境变量配置
2. **镜像构建失败**: 检查Dockerfile和.dockerignore
3. **服务连接问题**: 验证URL配置和网络权限
4. **数据库连接**: 确认DATABASE_URL格式和数据库可访问性

## 📊 当前系统功能

### 后端功能 ✅
- Multi-Agent AI对话 (Google ADK)
- 聊天记录保存和查询
- 用户信息管理
- 商家信息管理
- 作品集上传
- 文档上传到RAG系统
- 健康检查

### 仪表板功能 ✅
- 客户列表显示
- 聊天记录查看
- 作品集管理
- 商家设置
- 统计图表

### 聊天UI功能 ✅
- 实时AI对话
- 用户信息收集
- 会话管理
- 响应式设计

## 🚀 下一步

运行以下命令开始部署：

```bash
# 推荐：一键部署所有服务
./deploy_all_services.sh

# 或者逐个部署
./deploy_backend.sh
./deploy_dashboard.sh  
./deploy_chatui.sh
``` 