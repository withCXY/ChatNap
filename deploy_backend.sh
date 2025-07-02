#!/bin/bash

# 部署后端服务到Cloud Run
PROJECT_ID="confident-coder-462218-j2"
SERVICE_NAME="ai-customer-service-backend"
REGION="us-central1"

echo "🚀 部署后端服务..."

# 加载环境变量
if [ -f .env ]; then
    echo "📋 加载环境变量..."
    source .env
else
    echo "⚠️  警告: 未找到 .env 文件"
fi

# 构建并部署
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME} .

gcloud run services update ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
    --region ${REGION} \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --set-env-vars="DATABASE_URL=${DATABASE_URL},SUPABASE_URL=${SUPABASE_URL},SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY},SUPABASE_BUCKET_NAME=${SUPABASE_BUCKET_NAME},GOOGLE_CLOUD_PROJECT_ID=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=${REGION}"

echo "✅ 后端部署完成！"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')
echo "🌐 后端URL: ${SERVICE_URL}" 