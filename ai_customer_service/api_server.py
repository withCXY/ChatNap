from fastapi import FastAPI, Query, Body, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import tempfile
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import uuid
from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, BackgroundTasks
from supabase import create_client, Client
import vertexai
from vertexai.preview import rag
from google.api_core.exceptions import GoogleAPICallError
from google.auth import default
from google.auth.exceptions import DefaultCredentialsError
from google.oauth2 import service_account
import json
import sys

# ADK imports
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai.types import Content, Part
import asyncio
from agent import root_agent


load_dotenv()

app = FastAPI(title="Unified AI Customer Service API", description="Combined business operations and AI conversation API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ADK components
session_service = InMemorySessionService()
runner = Runner(
    agent=root_agent,
    app_name="ai_customer_service",
    session_service=session_service
)

# Helper function to save conversation to database
async def save_conversation_to_db(session_id: str, user_id: str, user_message: str, ai_response: str):
    """
    Save conversation to database with proper conversation management.
    Creates conversation if it doesn't exist and saves both user and AI messages.
    """
    conn = None
    try:
        conn = get_conn()
        cur = conn.cursor()
        
        # Get default merchant (assuming single merchant for now)
        cur.execute("SELECT id FROM merchants ORDER BY created_at DESC LIMIT 1")
        merchant_result = cur.fetchone()
        if not merchant_result:
            print("⚠️ No merchant found in database, creating default merchant")
            # Create a default merchant if none exists
            default_merchant_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO merchants (id, business_name, contact_email)
                VALUES (%s, %s, %s)
            """, (default_merchant_id, "Default Business", "admin@example.com"))
            merchant_id = default_merchant_id
        else:
            merchant_id = merchant_result[0]
        
        # Find or create user in database (handle both UUID and string user_ids)
        try:
            # First try to parse as UUID
            import uuid as uuid_lib
            user_uuid = str(uuid_lib.UUID(user_id))  # This will validate and normalize the UUID
            cur.execute("SELECT id FROM users WHERE id = %s", (user_uuid,))
        except (ValueError, TypeError):
            # If not a valid UUID, generate a new one and store the mapping
            user_uuid = str(uuid.uuid4())
            print(f"📝 Generated UUID {user_uuid} for user_id {user_id}")
            cur.execute("SELECT id FROM users WHERE id = %s", (user_uuid,))
        
        user_result = cur.fetchone()
        
        if not user_result:
            # Create anonymous user if doesn't exist
            cur.execute("""
                INSERT INTO users (id, full_name, platform)
                VALUES (%s, %s, %s)
            """, (user_uuid, "Anonymous User", "WebApp"))
            print(f"📝 Created anonymous user: {user_uuid}")
        
        # Use the UUID version for subsequent operations
        user_id = user_uuid
        
        # Use session_id as conversation_id (ensure it's a valid UUID)
        try:
            conversation_id = str(uuid_lib.UUID(session_id))  # Validate session_id as UUID
        except (ValueError, TypeError):
            conversation_id = str(uuid.uuid4())  # Generate new UUID if session_id is invalid
            print(f"📝 Generated new conversation UUID {conversation_id} for session {session_id}")
        
        # Check if conversation already exists
        cur.execute("SELECT id FROM conversations WHERE id = %s", (conversation_id,))
        conversation_result = cur.fetchone()
        
        if not conversation_result:
            # Create new conversation using session_id as conversation_id
            cur.execute("""
                INSERT INTO conversations (id, user_id, merchant_id, session_status)
                VALUES (%s, %s, %s, %s)
            """, (conversation_id, user_id, merchant_id, 'active'))
            print(f"📝 Created new conversation: {conversation_id}")
        
        # Save user message (handle potential id conflicts)
        if user_message and user_message.strip():
            try:
                message_id = str(uuid.uuid4())
                # Try inserting with explicit ID first
                cur.execute("""
                    INSERT INTO messages (id, conversation_id, sender, content)
                    VALUES (%s, %s, %s, %s)
                """, (message_id, conversation_id, 'user', user_message.strip()))
                print(f"💬 Saved user message to conversation: {conversation_id}")
            except Exception as msg_error:
                print(f"⚠️ Error with explicit ID, trying without: {msg_error}")
                # Fallback to letting database generate ID
                cur.execute("""
                    INSERT INTO messages (conversation_id, sender, content)
                    VALUES (%s, %s, %s)
                """, (conversation_id, 'user', user_message.strip()))
                print(f"💬 Saved user message (auto ID) to conversation: {conversation_id}")
        
        # Save AI response (handle potential id conflicts)
        if ai_response and ai_response.strip():
            try:
                message_id = str(uuid.uuid4())
                # Try inserting with explicit ID first
                cur.execute("""
                    INSERT INTO messages (id, conversation_id, sender, content)
                    VALUES (%s, %s, %s, %s)
                """, (message_id, conversation_id, 'agent', ai_response.strip()))
                print(f"🤖 Saved AI response to conversation: {conversation_id}")
            except Exception as msg_error:
                print(f"⚠️ Error with explicit ID, trying without: {msg_error}")
                # Fallback to letting database generate ID
                cur.execute("""
                    INSERT INTO messages (conversation_id, sender, content)
                    VALUES (%s, %s, %s)
                """, (conversation_id, 'agent', ai_response.strip()))
                print(f"🤖 Saved AI response (auto ID) to conversation: {conversation_id}")
        
        conn.commit()
        cur.close()
        print(f"✅ Successfully saved conversation to database")
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error saving conversation to database: {e}")
        import traceback
        traceback.print_exc()
        raise e
    finally:
        if conn:
            conn.close()

# Supabase Client (Still useful for other storage needs)
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)
BUCKET_NAME = os.environ.get("SUPABASE_BUCKET_NAME")

DB_URL = os.getenv("DATABASE_URL")

# Vertex AI Initialization
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION")

# Use Application Default Credentials (ADC) for better OAuth scope handling
vertexai.init(project=PROJECT_ID, location=LOCATION)



def get_conn():
    return psycopg2.connect(DB_URL)

def upload_to_rag_corpus(merchant_id: str, document_id: str, file_content: bytes, file_name: str, file_type: str):
    """
    Handles the logic for uploading a file to a merchant-specific RAG Corpus.
    This runs in the background.
    """
    corpus_display_name = f"merchant_corpus_{merchant_id}"
    corpus = None

    try:
        existing_corpora = rag.list_corpora()
        for existing_corpus in existing_corpora:
            if existing_corpus.display_name == corpus_display_name:
                corpus = existing_corpus
                break
        if corpus is None:
            print(f"Creating new corpus: {corpus_display_name}")
            corpus = rag.create_corpus(
                display_name=corpus_display_name,
                description="RAG Corpus for merchant documents"
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file_name}") as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        print(f"Uploading {file_name} to corpus {corpus.name} from temp path {temp_file_path}")
        rag_file = rag.upload_file(
            corpus_name=corpus.name,
            path=temp_file_path,
            display_name=file_name,
            description=f"Document uploaded by merchant {merchant_id}"
        )
        print(f"Successfully uploaded file. RAG file name: {rag_file.name}")

        # Update the document status in the database
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE merchant_documents SET processing_status='indexed', file_url=%s WHERE id=%s",
                (rag_file.name, document_id) # Store the RAG file name as the URL/identifier
            )
            conn.commit()
        conn.close()

    except Exception as e:
        print(f"Error during RAG upload for document {document_id}: {e}")
        # Update status to 'error'
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("UPDATE merchant_documents SET processing_status='error' WHERE id=%s", (document_id,))
            conn.commit()
        conn.close()
    finally:
        # Clean up the temporary file
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

# 聊天记录API
@app.get("/api/chat-history")
def get_chat_history(session_id: str = Query(...)):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM messages WHERE conversation_id=%s ORDER BY created_at ASC", (session_id,))
    data = cur.fetchall()
    cur.close()
    conn.close()
    return data

@app.post("/api/chat-history")
def add_chat_message(
    session_id: str = Body(...),
    sender: str = Body(...),
    message: str = Body(...),
    timestamp: Optional[str] = Body(None),
    avatar: Optional[str] = Body(None),
    user_id: Optional[str] = Body(None)
):
    conn = get_conn()
    cur = conn.cursor()
    # Only insert fields that exist in the messages table
    cur.execute(
        "INSERT INTO messages (conversation_id, sender, content) VALUES (%s, %s, %s)",
        (session_id, sender, message)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True}

# 用户列表API（包含聊天记录摘要）
@app.get("/api/customers")
def get_customers():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # 获取用户信息和最新对话摘要
    cur.execute("""
        SELECT DISTINCT
            u.id,
            u.full_name AS name,
            u.platform,
            u.phone_number AS phone,
            u.email,
            u.created_at,
            c.id AS session_id,
            c.session_status AS interaction_stage,
            CASE 
                WHEN u.email IS NOT NULL AND u.email != '' THEN 'Active'
                ELSE 'Pending'
            END AS account_status,
            COALESCE(
                (SELECT content 
                 FROM messages 
                 WHERE conversation_id = c.id 
                 ORDER BY created_at DESC 
                 LIMIT 1), 
                'No messages yet'
            ) AS conversation_summary
        FROM users u
        LEFT JOIN conversations c ON u.id = c.user_id
        WHERE u.platform IS NOT NULL
        ORDER BY u.created_at DESC
    """)
    
    data = cur.fetchall()
    
    # Process and format the data
    customers = []
    for row in data:
        customer = {
            'id': str(row['id']),
            'session_id': str(row['session_id']) if row['session_id'] else None,
            'name': row['name'] or 'Anonymous User',
            'platform': row['platform'] or 'WebApp',
            'phone': row['phone'] or 'N/A',
            'email': row['email'] or '',
            'created_at': row['created_at'].isoformat() if row['created_at'] else None,
            'conversationSummary': row['conversation_summary'] or 'No messages yet',
            'interactionStage': 'Ongoing' if row['interaction_stage'] == 'active' else 'Completed',
            'accountStatus': row['account_status']
        }
        customers.append(customer)
        print(f"📋 Processed customer: {customer['name']} - Session: {customer['session_id']} - Summary: {customer['conversationSummary'][:50]}...")
    
    cur.close()
    conn.close()
    return customers

# 预约/日历API（修正为calendar_events表，字段映射）
@app.get("/api/appointments")
def get_appointments():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        SELECT 
            ce.id, 
            ce.service_name AS title,
            ce.start_time AS start,
            ce.end_time AS end,
            ce.status,
            u.full_name AS user,
            u.phone_number AS customerPhone,
            ce.service_name AS serviceType,
            ce.service_description AS notes
        FROM calendar_events ce
        LEFT JOIN users u ON ce.user_id = u.id
        ORDER BY ce.start_time DESC
    ''')
    data = cur.fetchall()
    cur.close()
    conn.close()
    # 加color字段
    for event in data:
        status = event.get('status', '')
        if status == 'booked':
            event['color'] = 'bg-green-500'
        elif status == 'cancelled':
            event['color'] = 'bg-red-500'
        else:
            event['color'] = 'bg-blue-500'
    return data

# Portfolio列表API
@app.get("/api/portfolio")
def get_portfolio(merchant_email: str = Query(...)):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT p.* FROM portfolios p
        JOIN merchants m ON p.merchant_id = m.id
        WHERE m.contact_email = %s
        ORDER BY p.created_at DESC
    """, (merchant_email,))
    data = cur.fetchall()
    cur.close()
    conn.close()
    return data

# 商家信息API（修正为merchants表，字段映射）
@app.get("/api/business-info")
def get_business_info():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM merchants ORDER BY created_at DESC LIMIT 1")
    data = cur.fetchone()
    cur.close()
    conn.close()
    if not data:
        return {}
    return {
        "companyName": data["business_name"],
        "businessHours": data["working_hours"],
        "address": {
            "street": data["address"],
            "suite": ""
        },
        "contact": {
            "phone": data["phone_number"],
            "email": data["contact_email"]
        }
    }

# 商家设置API（写入merchants表，按email唯一）
@app.post("/api/merchant/settings")
def update_merchant_settings(
    business_name: str = Body(...),
    address: str = Body(...),
    working_hours: str = Body(...),
    phone_number: str = Body(...),
    contact_email: str = Body(...)
):
    conn = get_conn()
    cur = conn.cursor()
    # UPSERT by contact_email
    cur.execute('''
        INSERT INTO merchants (id, business_name, address, working_hours, phone_number, contact_email)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (contact_email) DO UPDATE SET
            business_name=EXCLUDED.business_name,
            address=EXCLUDED.address,
            working_hours=EXCLUDED.working_hours,
            phone_number=EXCLUDED.phone_number
    ''', (str(uuid.uuid4()), business_name, address, working_hours, phone_number, contact_email))
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True}

# 商家营业时间API（直接更新working_hours字段）
@app.post("/api/merchant/business-hours")
def update_business_hours(
    contact_email: str = Body(...),
    working_hours: str = Body(...)
):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('''
        UPDATE merchants SET working_hours=%s WHERE contact_email=%s
    ''', (working_hours, contact_email))
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True}

# Portfolio上传API
@app.post("/api/portfolio/upload")
async def upload_portfolio(
    background_tasks: BackgroundTasks,
    merchant_email: str = Form(...),
    image: UploadFile = File(...),
    tags: str = Form(...),
    description: str = Form(...),
    price: str = Form(...)
):
    """
    Handles portfolio upload:
    1. Finds the merchant by email.
    2. Uploads the image to Supabase Storage.
    3. Saves portfolio metadata to the database.
    """
    conn = None
    try:
        conn = get_conn()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM merchants WHERE contact_email = %s", (merchant_email,))
            merchant = cur.fetchone()
            if not merchant:
                raise HTTPException(status_code=404, detail="Merchant not found")
            merchant_id = merchant['id']

        # Read image content into memory
        image_content = await image.read()
        
        # Upload to Supabase Storage
        file_extension = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path_in_bucket = f"portfolios/{merchant_id}/{unique_filename}"

        supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path_in_bucket,
            file=image_content,
            file_options={"content-type": image.content_type}
        )
        image_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path_in_bucket)
        
        # Parse tags from string to array
        tags_array = [tag.strip() for tag in tags.split(',') if tag.strip()]
        
        # Parse price to numeric
        try:
            price_numeric = float(price.replace('$', '').replace(',', '').strip())
        except ValueError:
            price_numeric = 0.0
        
        # Save to portfolios table
        portfolio_id = str(uuid.uuid4())
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO portfolios (id, merchant_id, description, tags, price, image_url)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (portfolio_id, merchant_id, description, tags_array, price_numeric, image_url)
            )
            conn.commit()

        return {
            "success": True,
            "message": "Portfolio item uploaded successfully",
            "portfolio_id": portfolio_id,
            "image_url": image_url
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    finally:
        if conn: conn.close()

# 商家文档上传API（写入merchant_documents表，并预留RAG钩子）
@app.post("/api/merchant/upload-document")
async def upload_document(
    background_tasks: BackgroundTasks,
    merchant_email: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Handles document upload to both Supabase Storage and Vertex AI RAG:
    1. Finds the merchant by email.
    2. Uploads the file to Supabase Storage and gets the public URL.
    3. Saves metadata (including Supabase URL) to the database with 'processing' status.
    4. Triggers a background task to upload the same file to the RAG corpus.
    """
    conn = None
    try:
        conn = get_conn()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM merchants WHERE contact_email = %s", (merchant_email,))
            merchant = cur.fetchone()
            if not merchant:
                raise HTTPException(status_code=404, detail="Merchant not found")
            merchant_id = merchant['id']

        # Read file content into memory
        file_content = await file.read()
        
        # Step 1: Upload to Supabase Storage
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path_in_bucket = f"{merchant_id}/{unique_filename}"

        supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path_in_bucket,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        supabase_public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path_in_bucket)
        
        # Step 2: Immediately save metadata to DB, now with the Supabase URL
        document_id = str(uuid.uuid4())
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO merchant_documents (id, merchant_id, file_name, file_url, file_type, processing_status)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (document_id, merchant_id, file.filename, supabase_public_url, file.content_type, 'processing')
            )
            conn.commit()

        # Step 3: Trigger the RAG upload in the background
        background_tasks.add_task(
            upload_to_rag_corpus,
            merchant_id=str(merchant_id),
            document_id=document_id,
            file_content=file_content,
            file_name=file.filename,
            file_type=file.content_type
        )

        return {
            "success": True,
            "message": "File received. It is now stored and being submitted for AI indexing.",
            "document_id": document_id,
            "storage_url": supabase_public_url
        }

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        if conn: conn.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    finally:
        if conn: conn.close()


# =============================================================================
# ADK Integration - AI Conversation Endpoints
# =============================================================================

@app.post("/run")
async def run_agent(request: Dict[Any, Any] = Body(...)):
    """
    Main ADK endpoint for running AI agent conversations.
    Expected payload: {
        "appName": "ai_customer_service",
        "userId": "user123", 
        "sessionId": "session123",
        "newMessage": {
            "role": "user",
            "parts": [{"text": "Hello"}] or [{"inline_data": {...}}]
        }
    }
    """
    try:
        app_name = request.get("appName", request.get("app_name"))
        user_id = request.get("userId", request.get("user_id"))
        session_id = request.get("sessionId", request.get("session_id"))
        new_message = request.get("newMessage", request.get("new_message", {}))
        
        if app_name != "ai_customer_service":
            raise HTTPException(status_code=400, detail="Invalid app name")
            
        if not user_id or not session_id:
            raise HTTPException(status_code=400, detail="Missing user_id or session_id")
            
        # Extract message content
        parts = new_message.get("parts", [])
        if not parts:
            raise HTTPException(status_code=400, detail="No message parts provided")
            
        # Convert to ADK Content format
        genai_parts = []
        for part in parts:
            if "text" in part:
                genai_parts.append(Part(text=part["text"]))
            elif "inline_data" in part:
                # Handle image data
                genai_parts.append(Part(
                    inline_data={
                        "mime_type": part["inline_data"]["mime_type"],
                        "data": part["inline_data"]["data"]
                    }
                ))
        
        content = Content(role="user", parts=genai_parts)
        
        print(f"🤖 Processing message from user {user_id} in session {session_id}")
        
        # Extract user message content for database storage
        user_message_text = ""
        for part in parts:
            if "text" in part:
                user_message_text += part["text"]
        
        # Run the agent
        events = []
        async for event in runner.run_async(
            user_id=user_id, 
            session_id=session_id, 
            new_message=content
        ):
            events.append(event)
            print(f"📥 Event: {event}")
        
        # Convert events to the format expected by frontend
        response_events = []
        ai_response_text = ""
        
        for event in events:
            if hasattr(event, 'content') and event.content:
                response_events.append({
                    "content": {
                        "role": event.content.role,
                        "parts": [{"text": part.text} for part in event.content.parts if hasattr(part, 'text')]
                    }
                })
                
                # Extract AI response text for database storage
                if event.content.role == "model":
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            ai_response_text += part.text
        
        # Save conversation to database
        try:
            print(f"🗄️ Attempting to save conversation: user_msg='{user_message_text[:50]}...', ai_msg='{ai_response_text[:50]}...'")
            await save_conversation_to_db(session_id, user_id, user_message_text, ai_response_text)
            print(f"✅ Successfully saved conversation to database")
        except Exception as db_error:
            print(f"⚠️ Failed to save conversation to database: {db_error}")
            import traceback
            traceback.print_exc()
            # Continue execution even if database save fails
        
        print(f"✅ Returning {len(response_events)} events")
        return response_events if response_events else [{"content": {"role": "model", "parts": [{"text": "I received your message. How can I help you?"}]}}]
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"❌ Error in /run endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/apps/{app_name}/users/{user_id}/sessions")
async def create_session(app_name: str, user_id: str, request: Dict[Any, Any] = Body(...)):
    """
    Create a new session for ADK agent conversations.
    """
    try:
        if app_name != "ai_customer_service":
            raise HTTPException(status_code=400, detail="Invalid app name")
            
        state = request.get("state", {})
        
        # Create session using ADK session service
        session = await session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            state=state
        )
        
        print(f"✅ Created session {session.id} for user {user_id}")
        
        return {
            "id": session.id,
            "appName": session.app_name,
            "userId": session.user_id,
            "state": session.state,
            "events": [],
            "lastUpdateTime": session.last_update_time
        }
        
    except Exception as e:
        print(f"❌ Error creating session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@app.get("/apps/{app_name}/users/{user_id}/sessions/{session_id}")
async def get_session(app_name: str, user_id: str, session_id: str):
    """
    Get an existing session.
    """
    try:
        if app_name != "ai_customer_service":
            raise HTTPException(status_code=400, detail="Invalid app name")
            
        session = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        return {
            "id": session.id,
            "appName": session.app_name,
            "userId": session.user_id,
            "state": session.state,
            "events": session.events,
            "lastUpdateTime": session.last_update_time
        }
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"❌ Error getting session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")

@app.post("/api/user-info")
async def save_user_info(request: Dict[Any, Any] = Body(...)):
    """
    Save user information submitted from the frontend to the database.
    """
    conn = None
    try:
        name = request.get("name")
        platform = request.get("platform", "WebApp")
        phone = request.get("phone", "")
        email = request.get("email", "")
        session_id = request.get("session_id")
        user_id = request.get("user_id")
        
        print(f"💾 Saving user info to database: {name}, {platform}, {phone}, {email} for user {user_id}")
        
        conn = get_conn()
        cur = conn.cursor()
        
        # Insert or update user information (UPSERT by phone or email)
        user_uuid = str(uuid.uuid4())
        
        # Check if user already exists by phone or email
        cur.execute("""
            SELECT id FROM users 
            WHERE (phone_number = %s AND phone_number IS NOT NULL AND phone_number != '') 
               OR (email = %s AND email IS NOT NULL AND email != '')
            LIMIT 1
        """, (phone, email))
        
        existing_user = cur.fetchone()
        
        if existing_user:
            # Update existing user
            cur.execute("""
                UPDATE users 
                SET full_name = %s, platform = %s, phone_number = %s, email = %s
                WHERE id = %s
            """, (name, platform, phone or None, email or None, existing_user[0]))
            actual_user_id = existing_user[0]
            print(f"✅ Updated existing user: {actual_user_id}")
        else:
            # Insert new user
            cur.execute("""
                INSERT INTO users (id, full_name, platform, phone_number, email)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_uuid, name, platform, phone or None, email or None))
            actual_user_id = user_uuid
            print(f"✅ Created new user: {actual_user_id}")
        
        conn.commit()
        cur.close()
        
        return {
            "success": True, 
            "message": "User information saved successfully",
            "user_id": actual_user_id
        }
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error saving user info to database: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save user information: {str(e)}")
    finally:
        if conn:
            conn.close()

# =============================================================================
# Health Check
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "unified_ai_customer_service"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"🚀 Starting Unified AI Customer Service API on port {port}...")
    print("📋 Available endpoints:")
    print("   - AI Conversations: /run")
    print("   - Session Management: /apps/{app_name}/users/{user_id}/sessions")
    print("   - Business Operations: /api/portfolio/upload, /api/merchant/settings, etc.")
    print("   - Health Check: /health")
    uvicorn.run(app, host="0.0.0.0", port=port) 