import os
import time
from typing import List, Optional

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel


# Define the JSON schema using Pydantic.
class VideoSummarySegment(BaseModel):
    start_timestamp: float  # Start time in seconds.
    end_timestamp: float    # End time in seconds.
    user_speech: str        # Transcribed user speech during this segment.
    screen_events: List[str]  # List of detailed on-screen event descriptions.
    active_files: List[str]  # List of files accessed during this segment.
    visited_urls: List[str] # List of websites visited during this segment.

class VideoSummary(BaseModel):
    segments: List[VideoSummarySegment]
    overall_summary: str    # An overall summary of the video's content.

# Load environment variables and initialize the Gemini client.
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_api_key)

# Upload the video file.
start = time.time()
video_file = client.files.upload(file="record.mov")

# Wait until the video file is processed.
while video_file.state.name == "PROCESSING":
    print('.', end='')
    time.sleep(1)
    video_file = client.files.get(name=video_file.name)
print("\nVideo file is ready.")

# Define a system prompt that sets the role and instructs the model to output JSON.
system_prompt = (
    "System: You are a coding assistant specializing in debugging. Analyze the uploaded screen-recording video and extract "
    "key segments every 5 seconds. For each segment, provide detailed information including start and end timestamps, "
    "transcribed user speech, a list of on-screen events, a list of all files accessed during the time frame, "
    "and a list of all websites visited during the segment. Additionally, provide an overall summary of the debugging session."
)

# Define a user prompt that includes a sample expected response with 3 segments (each covering 2 seconds) with rich descriptions.
user_prompt = """
Analyze the video and return a JSON-formatted output matching this schema:

VideoSummary = {
  'segments': list[{
    'start_timestamp': float,
    'end_timestamp': float,
    'user_speech': str,
    'screen_events': list[str],
    'active_files': list[str],
    'visited_urls': list[str]
  }],
  'overall_summary': str
}

For example, your output should look like this (each segment 5 seconds):

{
  "segments": [
    {
      "start_timestamp": 0.0,
      "end_timestamp": 5.0,
      "user_speech": "Let's test the script and check the logs.",
      "screen_events": [
        "User opens 'server_log.py' in VS Code.",
        "User switches to 'config.yaml' to check API settings."
      ],
      "active_files": ["server_log.py", "config.yaml"],
      "visited_urls": []
    },
    {
      "start_timestamp": 5.0,
      "end_timestamp": 10.0,
      "user_speech": "There's an authentication error. Let me check the docs and open Postman.",
      "screen_events": [
        "User opens web browser and navigates to API authentication documentation.",
        "User switches to Postman and tests API credentials."
      ],
      "active_files": ["Postman"],
      "visited_urls": ["https://api.example.com/docs/auth"]
    },
    {
      "start_timestamp": 10.0,
      "end_timestamp": 13.4,
      "user_speech": "Let me verify the request headers in the API client.",
      "screen_events": [
        "User switches back to 'server_log.py' to inspect API request parameters.",
        "User opens 'headers.json' in VS Code."
      ],
      "active_files": ["server_log.py", "headers.json"],
      "visited_urls": []
    }
  ],
  "overall_summary": "The user debugs an API authentication error by analyzing 'server_log.py', checking API credentials in Postman, and consulting the API authentication documentation at https://api.example.com/docs/auth. Throughout the session, the user switches between multiple files, including 'config.yaml' and 'headers.json', to verify API configurations."
}
"""

# Call the Gemini API with the video file, system prompt, and user prompt.
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=[video_file, system_prompt, user_prompt],
    config={
        'response_mime_type': 'application/json',
        'response_schema': VideoSummary,
    },
)

# Print the structured JSON output.
print(response.text)
print("Total processing time:", time.time() - start)
