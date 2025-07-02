-- SQL Script V2 for AI Customer Service System on PostgreSQL (Supabase)
-- Revised based on detailed user requirements.

-- ========= 1. Merchants Table (商家信息) =========
-- Fully updated to include address, working hours, and phone number.
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,         -- 商店名称
    address TEXT,                        -- 商店地址
    working_hours TEXT,                  -- 工作时间 (e.g., "Mon-Fri 9:00-18:00")
    phone_number TEXT,                   -- 电话号码
    contact_email TEXT UNIQUE NOT NULL,  -- 商家邮箱
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE merchants IS '存储商家信息，包括地址、工作时间等';


-- ========= 2. Users Table (用户信息) =========
-- Updated to clarify platform and include both phone and email.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,                      -- 用户姓名
    platform TEXT,                       -- 平台来源 (e.g., 'WebApp', 'WeChat', 'WhatsApp')
    phone_number TEXT,                   -- 电话
    email TEXT,                          -- 邮箱
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(phone_number),                -- Ensure phone and email are unique across users
    UNIQUE(email)
);

COMMENT ON TABLE users IS '存储与机器人交互的终端用户信息';


-- ========= 3. Conversations Table (会话表) =========
-- No changes needed, this structure remains effective.
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    session_status TEXT DEFAULT 'active', -- 'active', 'closed', 'pending_merchant'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE conversations IS '管理独立的聊天会话以保持上下文';


-- ========= 4. Messages Table (聊天记录) =========
-- CRITICAL UPDATE: The sender type now includes 'merchant' for take-over scenarios.
CREATE TYPE sender_type AS ENUM ('user', 'agent', 'merchant');

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender sender_type NOT NULL,         -- 发送方: 用户, AI, 或商家
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE messages IS '存储会话中的所有聊天记录，发送方可以是用户、AI或商家';


-- ========= 5. Portfolios Table (Portfolio元数据) =========
-- Fully updated to include tags, description, and price.
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    description TEXT,                    -- 描述
    tags TEXT[],                         -- 标签 (使用PostgreSQL的数组类型)
    price NUMERIC(10, 2),                -- 价格 (使用NUMERIC避免浮点数精度问题)
    image_url TEXT NOT NULL,             -- 图片在Storage中的URL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE portfolios IS '存储商家Portfolio的元数据,图片本体在Supabase Storage';


-- ========= 6. Calendar Events Table (日历事件) =========
-- Updated to be more descriptive for booked services.
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    user_id UUID REFERENCES users(id),   -- 预约的用户
    service_name TEXT NOT NULL,          -- 预约的服务名称
    service_description TEXT,            -- 服务的详细描述
    start_time TIMESTAMPTZ NOT NULL,     -- 预约开始时间
    end_time TIMESTAMPTZ NOT NULL,       -- 预约结束时间
    status TEXT NOT NULL DEFAULT 'available', -- 状态: 'available', 'booked', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE calendar_events IS '管理商家的预约日历事件';


-- ========= 7. Merchant Documents Table (商家上传的文件) =========
-- NEW TABLE: Manages uploaded files like PDF, DOC for RAG.
-- This is more robust for handling various file types.
CREATE TABLE merchant_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,              -- 文件在Storage中的URL
    file_type TEXT,                      -- e.g., 'pdf', 'docx', 'txt'
    processing_status TEXT DEFAULT 'uploaded', -- 'uploaded', 'processing', 'indexed', 'error'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE merchant_documents IS '跟踪商家上传的用于RAG的源文件(PDF, DOC等)';



-- ========= RECOMMENDED: Indexes for Performance =========
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_portfolios_merchant_id ON portfolios(merchant_id);
CREATE INDEX idx_calendar_events_merchant_id ON calendar_events(merchant_id);
CREATE INDEX idx_merchant_documents_merchant_id ON merchant_documents(merchant_id);
