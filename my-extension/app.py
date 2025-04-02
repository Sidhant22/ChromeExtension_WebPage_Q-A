# Import Modules and respective libraries
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from tempfile import NamedTemporaryFile
import uuid
import time




app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension

# Configure API keys
os.environ["OPENAI_API_KEY"] = "API-KEY"  # Set your API key here or use environment variables

# Store page contexts temporarily
page_contexts = {}

@app.route('/')
def home():
    return "Server is running correctly!"

@app.route('/test-connection', methods=['GET'])
def test_connection():
    print("Test connection received!")
    return jsonify({
        'status': 'success',
        'message': 'Connection is working!'
    })

@app.route('/process-page', methods=['POST'])
def process_page():
    print("Received process-page request")
    data = request.json
    if not data:
        print("No JSON data received")
        return jsonify({'status': 'error', 'message': 'No data received'}), 400
    
    page_content = data.get('content', '')
    page_title = data.get('title', 'Untitled')
    page_url = data.get('url', '')
    
    print(f"Processing page: {page_title} ({len(page_content)} chars)")
    
    # Create a unique session ID for this page
    session_id = str(uuid.uuid4())
    
    try:
        # Save page content to temp file with explicit encoding
        with NamedTemporaryFile(mode='w', delete=False, suffix='.txt', encoding='utf-8') as temp_file:
            # Clean the content to remove problematic characters
            cleaned_content = page_content.encode('utf-8', errors='ignore').decode('utf-8')
            temp_file.write(cleaned_content)
            temp_file_path = temp_file.name
        
        print(f"Saved content to temporary file: {temp_file_path}")
        
        # Process the document with explicit encoding
        try:
            loader = TextLoader(temp_file_path, encoding='utf-8')
            documents = loader.load()
            print(f"Loaded {len(documents)} documents")
        except Exception as load_error:
            print(f"Error loading file: {str(load_error)}")
            #  a different encoding as fallback
            loader = TextLoader(temp_file_path, encoding='latin-1')
            documents = loader.load()
            print(f"Loaded {len(documents)} documents with fallback encoding")
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100
        )
        
        splits = text_splitter.split_documents(documents)
        print(f"Split into {len(splits)} chunks")
        
        # Optional: Log some chunks to verify content (limit to a few to avoid console spam)
        for idx, chunk in enumerate(splits[:3]):
            print(f"Sample chunk {idx}: {chunk.page_content[:100]}...")
        
        # Create vector store
        embeddings = OpenAIEmbeddings()
        vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)
        
        print("Created vector store")
        
        # Store context for later retrieval
        page_contexts[session_id] = {
            'vectorstore': vectorstore,
            'title': page_title,
            'url': page_url
        }
        
        # Clean up temp file
        try:
            os.unlink(temp_file_path)
        except Exception as e:
            print(f"Warning: Could not delete temp file: {str(e)}")
        
        print(f"Processing complete. Session ID: {session_id}")
        
        return jsonify({
            'status': 'success',
            'session_id': session_id,
            'message': f'Processed {page_title} with {len(splits)} chunks'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error processing page: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

def clean_expired_sessions():
    current_time = time.time()
    expired_sessions = []
    session_timeout = 3600  # 1 hour timeout (in seconds)
    
    for session_id, context in page_contexts.items():
        if current_time - context.get('timestamp', 0) > session_timeout:
            expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        del page_contexts[session_id]
        print(f"Cleaned expired session: {session_id}")
    
    print(f"Active sessions: {len(page_contexts)}")


@app.route('/keep-alive', methods=['POST'])
def keep_alive():
    data = request.json
    session_id = data.get('session_id')
    
    if not session_id or session_id not in page_contexts:
        return jsonify({
            'status': 'error',
            'valid': False,
            'message': 'Session not found or expired'
        })
    
    # Update the timestamp to keep the session alive
    page_contexts[session_id]['timestamp'] = time.time()
    
    return jsonify({
        'status': 'success',
        'valid': True,
        'message': 'Session refreshed'
    })


@app.route('/chat', methods=['POST'])
def chat():
    print("Received chat request")
    data = request.json
    if not data:
        print("No JSON data received")
        return jsonify({'status': 'error', 'message': 'No data received'}), 400
    
    session_id = data.get('session_id')
    query = data.get('query', '')
    
    print(f"Chat query: '{query}' for session {session_id}")
    
    # if not session_id or session_id not in page_contexts:
    #     print(f"Invalid session: {session_id}")
    #     return jsonify({
    #         'status': 'error',
    #         'message': 'Invalid or expired session'
    #     }), 400

    if not session_id:
        print("Missing session ID")
        return jsonify({
            'status': 'error',
            'message': 'No session ID provided'
        }), 400
    
    # if session_id not in page_contexts:
    #     print(f"Session not found: {session_id}")
    #     return jsonify({
    #         'status': 'error',
    #         'message': 'Session expired or not found. Please reload the page content.'
    #     }), 404

    if session_id in page_contexts:
        page_contexts[session_id]['timestamp'] = time.time()
    
    try:
        # Get the context for this page
        context = page_contexts[session_id]
        vectorstore = context['vectorstore']
        # Log session details
        print(f"Using session {session_id} with title: {context['title']}")

        # Create QA chain
        llm = ChatOpenAI(temperature=0.7, model_name="gpt-4")
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            # retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),  # Return top 5 results
            retriever=vectorstore.as_retriever(),
            return_source_documents=True
        )
        
        print("Created QA chain, generating response...")
        
        # Get response
        # response = qa_chain({"query": query})
        response = qa_chain.invoke({"query": query})

        
        print("Generated response")
        
        return jsonify({
            'status': 'success',
            'answer': response['result'],
            'context': {
                'title': context['title'],
                'url': context['url']
            }
        })
    except Exception as e:
        # if not response.get('result'):
        #     response['result'] = "Sorry, I couldn't find an answer. Could you ask a different question?"
        import traceback
        traceback.print_exc()
        print(f"Error in chat: {str(e)}")
    
        print(f"Error in chat: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    




if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, port=5000)