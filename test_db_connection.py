#!/usr/bin/env python3
"""
数据库连接测试脚本
在部署前运行此脚本确保数据库连接正常
"""

import psycopg2
import os
from dotenv import load_dotenv

def test_database_connection():
    """测试数据库连接"""
    print("🔍 正在测试数据库连接...")
    
    # 加载环境变量
    load_dotenv()
    
    # 获取数据库URL
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("❌ 错误: 未找到 DATABASE_URL 环境变量")
        print("📝 请确保在 .env 文件中设置了 DATABASE_URL")
        return False
    
    try:
        # 尝试连接数据库
        print(f"🔗 连接数据库: {db_url.split('@')[1] if '@' in db_url else 'unknown'}")
        conn = psycopg2.connect(db_url)
        
        # 执行简单查询
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print("✅ 数据库连接成功!")
        print(f"📊 PostgreSQL 版本: {version[0]}")
        
        # 检查关键表是否存在
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('merchants', 'users', 'conversations', 'messages', 'portfolios')
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"📋 找到数据表: {[table[0] for table in tables]}")
        
        if len(tables) >= 5:
            print("✅ 所有必需的数据表都已存在")
        else:
            print("⚠️  警告: 某些数据表可能缺失，请检查 database_schema.sql")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ 数据库连接失败: {e}")
        print("🔧 请检查:")
        print("   1. DATABASE_URL 格式是否正确")
        print("   2. 数据库服务器是否可访问")
        print("   3. 用户名和密码是否正确")
        return False
        
    except Exception as e:
        print(f"❌ 意外错误: {e}")
        return False

def test_supabase_config():
    """测试 Supabase 配置"""
    print("\n🔍 正在检查 Supabase 配置...")
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    bucket_name = os.getenv("SUPABASE_BUCKET_NAME")
    
    issues = []
    
    if not supabase_url:
        issues.append("SUPABASE_URL 未设置")
    elif not supabase_url.startswith("https://"):
        issues.append("SUPABASE_URL 格式不正确 (应以 https:// 开头)")
    
    if not supabase_key:
        issues.append("SUPABASE_SERVICE_KEY 未设置")
    elif len(supabase_key) < 100:
        issues.append("SUPABASE_SERVICE_KEY 可能不正确 (太短)")
    
    if not bucket_name:
        issues.append("SUPABASE_BUCKET_NAME 未设置")
    
    if issues:
        print("❌ Supabase 配置问题:")
        for issue in issues:
            print(f"   - {issue}")
        return False
    else:
        print("✅ Supabase 配置检查通过")
        return True

def test_google_cloud_config():
    """测试 Google Cloud 配置"""
    print("\n🔍 正在检查 Google Cloud 配置...")
    
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
    location = os.getenv("GOOGLE_CLOUD_LOCATION")
    
    issues = []
    
    if not project_id:
        issues.append("GOOGLE_CLOUD_PROJECT_ID 未设置")
    elif project_id != "confident-coder-462218-j2":
        issues.append(f"GOOGLE_CLOUD_PROJECT_ID 不匹配 (当前: {project_id}, 期望: confident-coder-462218-j2)")
    
    if not location:
        issues.append("GOOGLE_CLOUD_LOCATION 未设置")
    elif location != "us-central1":
        print(f"⚠️  GOOGLE_CLOUD_LOCATION: {location} (推荐: us-central1)")
    
    if issues:
        print("❌ Google Cloud 配置问题:")
        for issue in issues:
            print(f"   - {issue}")
        return False
    else:
        print("✅ Google Cloud 配置检查通过")
        return True

def main():
    """主函数"""
    print("=" * 50)
    print("🚀 AI客服系统部署前环境检查")
    print("=" * 50)
    
    # 检查各项配置
    db_ok = test_database_connection()
    supabase_ok = test_supabase_config()
    gcp_ok = test_google_cloud_config()
    
    print("\n" + "=" * 50)
    
    if db_ok and supabase_ok and gcp_ok:
        print("🎉 所有检查通过! 可以开始部署了")
        print("💡 运行以下命令开始部署:")
        print("   ./deploy_all_services.sh")
    else:
        print("❌ 存在配置问题，请先修复后再部署")
        print("📖 参考 DEPLOY_CHECKLIST.md 获取详细配置说明")
    
    print("=" * 50)

if __name__ == "__main__":
    main() 