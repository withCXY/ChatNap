#!/bin/bash

# 部署仪表板服务到Cloud Run
PROJECT_ID="confident-coder-462218-j2"
SERVICE_NAME="dashboard-app"
REGION="us-central1"
BACKEND_URL="https://ai-customer-service-backend-1078006235469.us-central1.run.app"

echo "📊 部署仪表板服务..."

cd frontend/ashboard-project-main

# 构建并部署，传入后端API URL
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_NEXT_PUBLIC_API_BASE_URL=${BACKEND_URL} .

gcloud run services update ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
    --region ${REGION} \
    --memory 1Gi \
    --cpu 1 \
    --set-env-vars "BACKEND_API_URL=${BACKEND_URL}"

cd ../..

echo "✅ 仪表板部署完成！"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')
echo "🌐 仪表板URL: ${SERVICE_URL}" 