import threading
import asyncio
from flask import Flask, jsonify, request
from flask_cors import CORS  # Import CORS handling
from stream_gemini import AudioLoop  # Import the streaming class
from time import sleep
from process_video import upload_video, reply
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route('/respond', methods=['POST'])
def respond():
    print('ok')
    video = request.files['video']
    video = upload_video(video)
    response = reply(video)
    
    return jsonify({"response": response}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)


