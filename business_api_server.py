from fastapi import FastAPI, Query, Body, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import tempfile
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import uuid
from supabase import create_client, Client
import vertexai
from vertexai.preview import rag
import sys

load_dotenv()

app = FastAPI(title="Business API Server", description="Handles business operations like portfolio, settings, etc.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)
BUCKET_NAME = os.environ.get("SUPABASE_BUCKET_NAME")

DB_URL = os.getenv("DATABASE_URL")

# Vertex AI Initialization
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION")
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
                (rag_file.name, document_id)
            )
            conn.commit()
        conn.close()

        print(f"✅ Successfully uploaded {file_name} to RAG corpus")

    except Exception as e:
        print(f"❌ Error uploading to RAG corpus: {e}")
        # Update status to error
        try:
            conn = get_conn()
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE merchant_documents SET processing_status='error' WHERE id=%s",
                    (document_id,)
                )
                conn.commit()
            conn.close()
        except Exception as db_error:
            print(f"❌ Error updating document status: {db_error}")

# Chat History API
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
    cur.execute(
        "INSERT INTO messages (conversation_id, sender, content) VALUES (%s, %s, %s)",
        (session_id, sender, message)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True}

# Business Information API
@app.get("/api/business-info")
def get_business_info():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM merchants LIMIT 1")
    data = cur.fetchone()
    cur.close()
    conn.close()
    
    if data:
        return {
            "businessName": data.get("business_name", ""),
            "address": data.get("address", ""),
            "phone": data.get("phone_number", ""),
            "email": data.get("contact_email", ""),
            "hours": data.get("working_hours", "")
        }
    return {
        "businessName": "",
        "address": "",
        "phone": "",
        "email": "",
        "hours": ""
    }

# Customer Management APIs
@app.get("/api/customers")
def get_customers():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT u.*, c.session_status, c.created_at as conversation_started
        FROM users u
        LEFT JOIN conversations c ON u.id = c.user_id
        ORDER BY c.created_at DESC
    """)
    customers = cur.fetchall()
    cur.close()
    conn.close()
    return customers or []

@app.get("/api/bookings")
def get_bookings():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT b.*, u.full_name as customer_name, u.phone_number, u.email
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.appointment_time DESC
    """)
    bookings = cur.fetchall()
    cur.close()
    conn.close()
    return bookings or []

@app.get("/api/appointments")
def get_appointments():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT a.*, a."user" as customer_name
        FROM appointments a
        ORDER BY a.datetime DESC
    """)
    appointments = cur.fetchall()
    cur.close()
    conn.close()
    return appointments or []

# Portfolio API
@app.get("/api/portfolio")
def get_portfolio():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM portfolios ORDER BY created_at DESC")
    portfolios = cur.fetchall()
    cur.close()
    conn.close()
    return portfolios or []

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
        if conn: 
            conn.rollback()
        print(f"❌ Error uploading portfolio: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    finally:
        if conn: 
            conn.close()

# Merchant Settings API
@app.get("/api/merchant/settings")
def get_merchant_settings():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM merchants LIMIT 1")
    data = cur.fetchone()
    cur.close()
    conn.close()
    return data or {}

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

# Document Upload API
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
        if conn: 
            conn.rollback()
        print(f"❌ Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    finally:
        if conn: 
            conn.close()

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Business API Server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001) 