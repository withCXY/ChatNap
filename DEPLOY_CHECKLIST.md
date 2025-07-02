# 🚀 AI客服系统部署前检查清单

## 📋 环境变量准备清单

### 1. 必需的环境变量
在开始部署前，请确保你有以下所有环境变量的值：

```bash
# ✅ 数据库连接 (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:your-password@your-host:port/postgres

# ✅ Supabase 配置
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET_NAME=your-bucket-name

# ✅ Google Cloud 配置
GOOGLE_CLOUD_PROJECT_ID=confident-coder-462218-j2
GOOGLE_CLOUD_LOCATION=us-central1

# ✅ Cloud Run 配置
PORT=8080
```

### 2. 如何获取这些变量

#### 🔗 Supabase 配置
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings > API**：
   - 复制 `Project URL` → `SUPABASE_URL`
   - 复制 `service_role secret` → `SUPABASE_SERVICE_KEY`
4. 进入 **Settings > Database**：
   - 复制连接字符串 → `DATABASE_URL`
5. 进入 **Storage**：
   - 创建一个 bucket → `SUPABASE_BUCKET_NAME`

#### ☁️ Google Cloud 配置
- `GOOGLE_CLOUD_PROJECT_ID`: 你的项目ID是 `confident-coder-462218-j2`
- `GOOGLE_CLOUD_LOCATION`: 推荐使用 `us-central1`

## 🔧 部署前系统检查

### 1. 检查 Google Cloud SDK
```bash
# 验证已安装 gcloud
gcloud version

# 验证已登录正确账户
gcloud auth list

# 验证当前项目
gcloud config get-value project
# 应该显示: confident-coder-462218-j2
```

### 2. 设置正确的项目
```bash
# 如果项目不正确，设置为正确的项目
gcloud config set project confident-coder-462218-j2

# 启用必需的 API
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. 测试本地数据库连接
```bash
# 在项目根目录创建测试脚本
echo 'import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(DB_URL)
    print("✅ 数据库连接成功!")
    conn.close()
except Exception as e:
    print(f"❌ 数据库连接失败: {e}")
' > test_db_connection.py

# 运行测试
python test_db_connection.py
```

### 4. 验证本地服务运行正常
```bash
# 在一个终端启动后端
cd /Users/linjia/Desktop/Google_Hackathon/frontend-ai-service-repo
source /Users/linjia/Desktop/Google_Hackathon/multi_agent_customer_service/.venv/bin/activate
python ai_customer_service/api_server.py

# 在另一个终端测试健康检查
curl http://localhost:8000/health
# 应该返回: {"status":"healthy","service":"unified_ai_customer_service"}
```

## 📝 环境变量设置方式

### 方式1: 通过脚本设置 (推荐)
创建 `.env.deploy` 文件：
```bash
# 复制环境变量模板
cat > .env.deploy << 'EOF'
DATABASE_URL=postgresql://postgres:your-password@your-host:port/postgres
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET_NAME=your-bucket-name
GOOGLE_CLOUD_PROJECT_ID=confident-coder-462218-j2
GOOGLE_CLOUD_LOCATION=us-central1
PORT=8080
EOF

# 编辑文件，填入实际值
nano .env.deploy
```

### 方式2: 通过 Cloud Console 设置
1. 部署后访问 [Cloud Run Console](https://console.cloud.google.com/run)
2. 点击你的服务
3. 点击 "编辑和部署新版本"
4. 进入 "变量和密钥" 标签页
5. 逐个添加环境变量

## 🚀 开始部署

### 1. 一键部署所有服务 (推荐)
```bash
# 确保你在项目根目录
cd /Users/linjia/Desktop/Google_Hackathon/frontend-ai-service-repo

# 给部署脚本执行权限
chmod +x deploy_all_services.sh

# 开始部署
./deploy_all_services.sh
```

### 2. 分步部署
```bash
# 1. 先部署后端
chmod +x deploy_backend.sh
./deploy_backend.sh

# 2. 等待后端部署完成后，部署前端服务
chmod +x deploy_dashboard.sh
./deploy_dashboard.sh

chmod +x deploy_chatui.sh
./deploy_chatui.sh
```

## ✅ 部署成功验证

### 1. 检查服务状态
```bash
# 检查所有服务
gcloud run services list --region=us-central1

# 应该看到三个服务都显示为 READY
```

### 2. 测试后端API
```bash
# 健康检查
curl https://ai-customer-service-backend-1078006235469.us-central1.run.app/health

# 测试客户列表API
curl https://ai-customer-service-backend-1078006235469.us-central1.run.app/api/customers

# 测试AI对话API
curl -X POST https://ai-customer-service-backend-1078006235469.us-central1.run.app/run \
  -H "Content-Type: application/json" \
  -d '{"appName":"ai_customer_service","userId":"test","sessionId":"123","newMessage":{"role":"user","parts":[{"text":"hello"}]}}'
```

### 3. 测试前端应用
- **商家仪表板**: https://dashboard-app-1078006235469.us-central1.run.app
- **用户聊天UI**: https://ai-customer-service-chat-ui-1078006235469.us-central1.run.app

## 🔍 故障排除

### 常见问题及解决方案

#### 1. 环境变量问题
```bash
# 检查服务的环境变量
gcloud run services describe ai-customer-service-backend --region=us-central1 --format="export"
```

#### 2. 构建失败
```bash
# 查看构建日志
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

#### 3. 服务启动失败
```bash
# 查看服务日志
gcloud logs read --service=ai-customer-service-backend --region=us-central1 --limit=50
```

#### 4. 前端无法连接后端
- 确认后端服务已启动且健康检查通过
- 检查前端的 `BACKEND_API_URL` 或 `NEXT_PUBLIC_API_URL` 环境变量
- 确认没有 CORS 问题

## 📊 监控和维护

### 查看服务监控
```bash
# 检查服务指标
gcloud run services describe ai-customer-service-backend --region=us-central1

# 查看实时日志
gcloud logs tail --service=ai-customer-service-backend --region=us-central1
```

### 更新服务
```bash
# 快速重新部署后端
./quick_deploy.sh

# 或使用 Cloud Console 手动触发新部署
```

---

## 🎯 准备完成检查清单

在开始部署前，请确认以下项目都已完成：

- [ ] ✅ 已安装并配置 Google Cloud SDK
- [ ] ✅ 已设置正确的 Google Cloud 项目 (`confident-coder-462218-j2`)
- [ ] ✅ 已启用必需的 Google Cloud API
- [ ] ✅ 已获取所有必需的环境变量值
- [ ] ✅ 本地数据库连接测试通过
- [ ] ✅ 本地服务运行正常
- [ ] ✅ 已给部署脚本执行权限

**全部完成后，运行:** `./deploy_all_services.sh`

---

*🚀 准备好了吗？让我们开始部署！* 