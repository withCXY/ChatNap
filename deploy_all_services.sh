#!/bin/bash

# 部署所有AI客服系统服务到Cloud Run
# 项目: confident-coder-462218-j2

PROJECT_ID="confident-coder-462218-j2"
REGION="us-central1"

# 服务配置
BACKEND_SERVICE="ai-customer-service-backend"
DASHBOARD_SERVICE="dashboard-app"
CHATUI_SERVICE="ai-customer-service-chat-ui"

# URL配置 - 确保服务间能正确通信
BACKEND_URL="https://ai-customer-service-backend-1078006235469.us-central1.run.app"
DASHBOARD_URL="https://dashboard-app-1078006235469.us-central1.run.app"
CHATUI_URL="https://ai-customer-service-chat-ui-1078006235469.us-central1.run.app"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 开始部署所有AI客服系统服务...${NC}"
echo -e "${BLUE}📋 项目: ${PROJECT_ID}${NC}"
echo -e "${BLUE}📋 区域: ${REGION}${NC}"
echo ""

# 函数：部署后端服务
deploy_backend() {
    echo -e "${YELLOW}📦 部署后端服务...${NC}"
    
    # 构建后端镜像
    gcloud builds submit --tag gcr.io/${PROJECT_ID}/${BACKEND_SERVICE} .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 后端镜像构建失败${NC}"
        return 1
    fi
    
    # 更新后端服务
    gcloud run services update ${BACKEND_SERVICE} \
        --image gcr.io/${PROJECT_ID}/${BACKEND_SERVICE} \
        --region ${REGION} \
        --memory 2Gi \
        --cpu 2 \
        --timeout 300
    
    return $?
}

# 函数：部署仪表板服务
deploy_dashboard() {
    echo -e "${YELLOW}📊 部署仪表板服务...${NC}"
    
    cd frontend/ashboard-project-main
    
    # 构建仪表板镜像，传入后端API URL
    gcloud builds submit --tag gcr.io/${PROJECT_ID}/${DASHBOARD_SERVICE} \
        --build-arg NEXT_PUBLIC_API_BASE_URL=${BACKEND_URL} .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 仪表板镜像构建失败${NC}"
        cd ../..
        return 1
    fi
    
    # 更新仪表板服务
    gcloud run services update ${DASHBOARD_SERVICE} \
        --image gcr.io/${PROJECT_ID}/${DASHBOARD_SERVICE} \
        --region ${REGION} \
        --memory 1Gi \
        --cpu 1 \
        --set-env-vars "NEXT_PUBLIC_API_BASE_URL=${BACKEND_URL}"
    
    cd ../..
    return $?
}

# 函数：部署聊天UI服务
deploy_chatui() {
    echo -e "${YELLOW}💬 部署聊天UI服务...${NC}"
    
    cd frontend/UI
    
    # 构建聊天UI镜像，传入后端API URL
    gcloud builds submit --tag gcr.io/${PROJECT_ID}/${CHATUI_SERVICE} \
        --build-arg NEXT_PUBLIC_API_BASE_URL=${BACKEND_URL} .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 聊天UI镜像构建失败${NC}"
        cd ../..
        return 1
    fi
    
    # 更新聊天UI服务
    gcloud run services update ${CHATUI_SERVICE} \
        --image gcr.io/${PROJECT_ID}/${CHATUI_SERVICE} \
        --region ${REGION} \
        --memory 1Gi \
        --cpu 1 \
        --set-env-vars "NEXT_PUBLIC_API_BASE_URL=${BACKEND_URL}"
    
    cd ../..
    return $?
}

# 函数：测试服务健康状态
test_services() {
    echo -e "${YELLOW}🔍 测试服务健康状态...${NC}"
    
    # 测试后端
    echo "测试后端健康检查..."
    if curl -s "${BACKEND_URL}/health" | grep -q "healthy"; then
        echo -e "${GREEN}✅ 后端服务正常${NC}"
    else
        echo -e "${RED}❌ 后端服务异常${NC}"
    fi
    
    # 测试仪表板
    echo "测试仪表板..."
    if curl -s -o /dev/null -w "%{http_code}" "${DASHBOARD_URL}" | grep -q "200"; then
        echo -e "${GREEN}✅ 仪表板服务正常${NC}"
    else
        echo -e "${RED}❌ 仪表板服务异常${NC}"
    fi
    
    # 测试聊天UI
    echo "测试聊天UI..."
    if curl -s -o /dev/null -w "%{http_code}" "${CHATUI_URL}" | grep -q "200"; then
        echo -e "${GREEN}✅ 聊天UI服务正常${NC}"
    else
        echo -e "${RED}❌ 聊天UI服务异常${NC}"
    fi
}

# 主部署流程
main() {
    # 检查gcloud登录状态
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${RED}❌ 请先登录Google Cloud: gcloud auth login${NC}"
        exit 1
    fi
    
    # 部署后端
    if deploy_backend; then
        echo -e "${GREEN}✅ 后端部署成功${NC}"
    else
        echo -e "${RED}❌ 后端部署失败${NC}"
        exit 1
    fi
    
    sleep 30  # 等待后端服务完全启动
    
    # 并行部署前端服务
    echo -e "${YELLOW}🚀 并行部署前端服务...${NC}"
    
    deploy_dashboard &
    DASHBOARD_PID=$!
    
    deploy_chatui &
    CHATUI_PID=$!
    
    # 等待两个前端服务部署完成
    wait $DASHBOARD_PID
    DASHBOARD_STATUS=$?
    
    wait $CHATUI_PID
    CHATUI_STATUS=$?
    
    # 检查部署结果
    if [ $DASHBOARD_STATUS -eq 0 ]; then
        echo -e "${GREEN}✅ 仪表板部署成功${NC}"
    else
        echo -e "${RED}❌ 仪表板部署失败${NC}"
    fi
    
    if [ $CHATUI_STATUS -eq 0 ]; then
        echo -e "${GREEN}✅ 聊天UI部署成功${NC}"
    else
        echo -e "${RED}❌ 聊天UI部署失败${NC}"
    fi
    
    # 等待服务启动并测试
    echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
    sleep 60
    
    test_services
    
    # 显示最终结果
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${BLUE}📋 服务URL:${NC}"
    echo -e "   🔧 后端API: ${BACKEND_URL}"
    echo -e "   📊 商家仪表板: ${DASHBOARD_URL}"
    echo -e "   💬 用户聊天: ${CHATUI_URL}"
    echo ""
    echo -e "${BLUE}🔗 API端点:${NC}"
    echo -e "   📋 健康检查: ${BACKEND_URL}/health"
    echo -e "   📖 API文档: ${BACKEND_URL}/docs"
    echo -e "   👥 客户列表: ${BACKEND_URL}/api/customers"
}

# 运行主函数
main "$@" 