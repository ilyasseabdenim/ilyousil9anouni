from flask import Flask, render_template, request, jsonify
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import UserMessage, SystemMessage
from azure.core.credentials import AzureKeyCredential
import os

app = Flask(__name__)

# Configuration
API_KEY = os.getenv('DEEPSEEK_API_KEY') # Note: In production, use environment variables
ENDPOINT = "https://models.github.ai/inference"

# Initialize the Azure AI client
client = ChatCompletionsClient(
    endpoint=ENDPOINT,
    credential=AzureKeyCredential(API_KEY),
)

# Store conversation history (simple in-memory storage, use a database in production)
conversations = {}

# Define the system message for fine-tuning
SYSTEM_MESSAGE = """You are a legal assistant specialized in Moroccan law. 
Provide accurate, helpful information about Moroccan legal codes, procedures, and regulations. 
Reference specific articles and laws when possible. 
If you're uncertain, clearly state the limitations of your knowledge. 
Always recommend consulting a qualified Moroccan lawyer for specific legal advice. 
Respond in moroccan darija with arabic letters."""

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask():
    try:
        # Get the message from the request
        data = request.get_json()
        user_message = data.get('message', '')
        
        # Get session ID (in production, use proper session management)
        session_id = request.remote_addr
        
        # Initialize conversation history for this session if it doesn't exist
        if session_id not in conversations:
            conversations[session_id] = []
            # Add system message to new conversations
            conversations[session_id].append({"role": "system", "content": SYSTEM_MESSAGE})
        
        # Add user message to history
        conversations[session_id].append({"role": "user", "content": user_message})
        
        # Keep only the last 6 messages (system message + 5 exchanges) to avoid exceeding token limits
        if len(conversations[session_id]) > 11:  # Keep system message + last 5 exchanges (10 messages)
            # Keep system message (first) and the last 10 messages
            conversations[session_id] = [conversations[session_id][0]] + conversations[session_id][-10:]
        
        # Call the DeepSeek model
        response = client.complete(
            messages=conversations[session_id],
            model="deepseek/DeepSeek-V3-0324",  # Make sure this matches your deployment name
            max_tokens=100000,
            temperature=0.8,
        )
        
        # Get the generated text
        generated_text = response.choices[0].message.content
        
        # Add assistant response to history
        conversations[session_id].append({"role": "assistant", "content": generated_text})
        
        return jsonify({'response': generated_text})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
