#!/bin/bash

# 快速部署到你现有的Cloud Run服务
# 项目: confident-coder-462218-j2
# 更新现有的 ai-customer-service-backend 服务

PROJECT_ID="confident-coder-462218-j2"
SERVICE_NAME="ai-customer-service-backend"
REGION="us-central1"

echo "🚀 开始快速重新部署..."
echo "📋 项目: $PROJECT_ID"
echo "📋 服务: $SERVICE_NAME"
echo "📋 区域: $REGION"

# 使用Cloud Build构建镜像 (推荐，无需本地Docker)
echo "🔨 使用Cloud Build构建镜像..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

# 更新现有服务
echo "🚀 更新Cloud Run服务..."
gcloud run services update ${SERVICE_NAME} \
    --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
    --region ${REGION}

if [ $? -eq 0 ]; then
    echo "✅ 部署成功！"
    
    # 获取服务URL
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')
    echo "🌐 服务URL: ${SERVICE_URL}"
    
    # 测试健康检查
    echo "🔍 测试健康检查..."
    sleep 5
    if curl -s "${SERVICE_URL}/health" | grep -q "healthy"; then
        echo "✅ 健康检查通过！"
        echo "🎉 重新部署完成！"
        echo ""
        echo "📋 部署信息:"
        echo "   - 后端API: ${SERVICE_URL}"
        echo "   - 健康检查: ${SERVICE_URL}/health"
        echo "   - API文档: ${SERVICE_URL}/docs"
    else
        echo "⚠️ 健康检查失败，请检查日志"
        echo "查看日志: gcloud logs read --service=${SERVICE_NAME} --region=${REGION} --limit=50"
    fi
else
    echo "❌ 部署失败"
    exit 1
fi 