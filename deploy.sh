#!/bin/bash

# 部署AI客服系统到Google Cloud Run

# 设置变量 - 请根据你的项目配置修改
PROJECT_ID="confident-coder-462218-j2"  # 替换为你的项目ID
SERVICE_NAME="ai-customer-service"  # 服务名称
REGION="us-central1"  # 区域，你可以选择其他区域如us-central1
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署AI客服系统到Cloud Run...${NC}"

# 检查是否已登录gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ 请先登录Google Cloud: gcloud auth login${NC}"
    exit 1
fi

# 检查项目是否设置
CURRENT_PROJECT=$(gcloud config get-value project)
if [ -z "$CURRENT_PROJECT" ]; then
    echo -e "${RED}❌ 请先设置项目: gcloud config set project YOUR_PROJECT_ID${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 当前项目: ${CURRENT_PROJECT}${NC}"
echo -e "${YELLOW}📋 服务名称: ${SERVICE_NAME}${NC}"
echo -e "${YELLOW}📋 区域: ${REGION}${NC}"

# 构建Docker镜像
echo -e "${GREEN}🔨 构建Docker镜像...${NC}"
docker build -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker镜像构建失败${NC}"
    exit 1
fi

# 推送镜像到Container Registry
echo -e "${GREEN}📤 推送镜像到Container Registry...${NC}"
docker push $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 镜像推送失败${NC}"
    exit 1
fi

# 部署到Cloud Run
echo -e "${GREEN}🚀 部署到Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --set-env-vars "ENVIRONMENT=production"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 部署成功！${NC}"
    
    # 获取服务URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
    echo -e "${GREEN}🌐 服务URL: ${SERVICE_URL}${NC}"
    echo -e "${GREEN}🔍 健康检查: ${SERVICE_URL}/health${NC}"
    
    # 测试健康检查
    echo -e "${YELLOW}🔍 测试健康检查...${NC}"
    sleep 10
    if curl -s "${SERVICE_URL}/health" | grep -q "healthy"; then
        echo -e "${GREEN}✅ 健康检查通过！${NC}"
    else
        echo -e "${RED}❌ 健康检查失败，请检查日志${NC}"
        echo -e "${YELLOW}查看日志: gcloud logs read --service=${SERVICE_NAME} --region=${REGION}${NC}"
    fi
else
    echo -e "${RED}❌ 部署失败${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 部署完成！${NC}" 