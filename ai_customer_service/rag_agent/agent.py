from google.adk.agents import Agent
from google.adk.tools.retrieval.vertex_ai_rag_retrieval import VertexAiRagRetrieval
from vertexai.preview import rag
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

def get_merchant_corpus_for_session(session_id=None):
    """
    Get the RAG corpus for the merchant associated with the current session.
    If session_id is provided, look up the merchant and find their corpus.
    Otherwise, fall back to the default corpus.
    """
    if session_id:
        try:
            # Get database connection
            DB_URL = os.getenv("DATABASE_URL")
            conn = psycopg2.connect(DB_URL)
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Find the merchant for this session
                cur.execute("""
                    SELECT m.id FROM merchants m
                    JOIN conversations c ON c.merchant_id = m.id
                    WHERE c.id = %s
                """, (session_id,))
                result = cur.fetchone()
                
                if result:
                    merchant_id = result['id']
                    corpus_display_name = f"merchant_corpus_{merchant_id}"
                    
                    # List all corpora and find the merchant-specific one
                    existing_corpora = rag.list_corpora()
                    for corpus in existing_corpora:
                        if corpus.display_name == corpus_display_name:
                            conn.close()
                            return corpus.name
            conn.close()
        except Exception as e:
            print(f"Error finding merchant corpus for session {session_id}: {e}")
    
    # Fallback to default RAG corpus
    return os.environ.get("RAG_CORPUS")

def create_dynamic_rag_tool(session_id=None):
    """
    Create a RAG retrieval tool with the appropriate corpus for the session.
    """
    corpus_name = get_merchant_corpus_for_session(session_id)
    
    if not corpus_name:
        print("⚠️ No RAG corpus available")
        return None
        
    return VertexAiRagRetrieval(
        name='retrieve_rag_documentation',
        description=(
            'Use this tool to retrieve documentation and reference materials for the question from the RAG corpus. '
            'This includes FAQs, business information, service details, and other relevant documentation.'
        ),
        rag_resources=[
            rag.RagResource(
                rag_corpus=corpus_name
            )
        ],
        similarity_top_k=10,
        vector_distance_threshold=0.6,
    )

# Default RAG tool for initialization (will be dynamically replaced per session)
default_corpus = get_merchant_corpus_for_session()
ask_vertex_retrieval = VertexAiRagRetrieval(
    name='retrieve_rag_documentation',
    description=(
        'Use this tool to retrieve documentation and reference materials for the question from the RAG corpus. '
        'This includes FAQs, business information, service details, and other relevant documentation.'
    ),
    rag_resources=[
        rag.RagResource(
            rag_corpus=default_corpus
        )
    ] if default_corpus else [],
    similarity_top_k=10,
    vector_distance_threshold=0.6,
)

def create_rag_agent_with_session(session_id=None):
    """
    Create a RAG agent with session-specific corpus selection.
    This allows the agent to use merchant-specific knowledge base.
    """
    # Get the appropriate RAG tool for this session
    rag_tool = create_dynamic_rag_tool(session_id)
    
    # If no RAG tool available, use the default one
    tools = [rag_tool] if rag_tool else [ask_vertex_retrieval]
    
    return Agent(
        model='gemini-2.5-flash',
        name='RagAgent',
        description='This agent can answers questions like FAQs based on a specialized corpus of documents using retrieval techniques.',
        instruction="""
            You are an AI assistant with access to specialized corpus of documents.
            Your role is to provide accurate and concise answers to questions based
            on documents that are retrievable using the retrieval tool. If you believe
            the user is just chatting and having casual conversation, don't use the retrieval tool.

            But if the user is asking a specific question about a knowledge they expect you to have,
            you can use the retrieval tool to fetch the most relevant information.
            
            If you are not certain about the user intent, make sure to ask clarifying questions
            before answering. Once you have the information you need, you can use the retrieval tool
            If you cannot provide an answer, clearly explain why.

            Do not answer questions that are not related to the corpus.
            When crafting your answer, you may use the retrieval tool to fetch details
            from the corpus. Make sure to cite the source of the information.
            
            Citation Format Instructions:
     
            When you provide an answer, you must also add one or more citations **at the end** of
            your answer. If your answer is derived from only one retrieved chunk,
            include exactly one citation. If your answer uses multiple chunks
            from different files, provide multiple citations. If two or more
            chunks came from the same file, cite that file only once.

            **How to cite:**
            - Use the retrieved chunk's `title` to reconstruct the reference.
            - Include the document title and section if available.
            - For web resources, include the full URL when available.
     
            Format the citations at the end of your answer under a heading like
            "Citations" or "References." For example:
            "Citations:
            1) RAG Guide: Implementation Best Practices
            2) Advanced Retrieval Techniques: Vector Search Methods"

            Do not reveal your internal chain-of-thought or how you used the chunks.
            Simply provide concise and factual answers, and then list the
            relevant citation(s) at the end. If you are not certain or the
            information is not available, clearly state that you do not have
            enough information.
            """,
        tools=tools
    )

# Create default RAG agent for backward compatibility
rag_agent = create_rag_agent_with_session()