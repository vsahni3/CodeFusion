import os
import time
from typing import List, Optional
from io import BytesIO
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
    user_intention: str     # The user's intended code changes based on the video.

# Load environment variables and initialize the Gemini client.
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_api_key)
def upload_video(video):
    video_file = client.files.upload(file=BytesIO(video.read()), config={"mime_type": "video/mp4"})
    # Wait until the video file is processed.
    while video_file.state.name == "PROCESSING":
        print('.', end='')
        time.sleep(0.5)
        video_file = client.files.get(name=video_file.name)
    return video_file


# Define a system prompt that sets the role and instructs the model to output JSON.
system_prompt = (
    "System: You are a coding assistant specializing in debugging. Analyze the uploaded screen-recording video and extract "
    "key segments every 3 seconds. For each segment, provide detailed information including start and end timestamps, "
    "transcribed user speech, a list of on-screen events, a list of all files accessed during the time frame, "
    "and a list of all websites visited during the segment. Additionally, provide an overall summary of the debugging session."
)

# Define a user prompt that includes a sample expected response with 3 segments (each covering 2 seconds) with rich descriptions.

user_prompt = (
    "Analyze the video and return a JSON-formatted output matching this schema:\n\n"
    "VideoSummary = {\n"
    "  'segments': list[{\n"
    "    'start_timestamp': float,\n"
    "    'end_timestamp': float,\n"
    "    'user_speech': str,\n"
    "    'screen_events': list[str],\n"
    "    'active_files': list[str],\n"
    "    'visited_urls': list[str]\n"
    "  }],\n"
    "  'overall_summary': str\n"
    "  'user_intention': str\n"
    "}\n\n"
    "For example, your output should look like this (each segment 3 seconds):\n\n"
    "```\n"
    "{\n"
    "  \"segments\": [\n"
    "    {\n"
    "      \"start_timestamp\": 0.0,\n"
    "      \"end_timestamp\": 3.0,\n"
    "      \"user_speech\": \"Let's test the script and check the logs.\",\n"
    "      \"screen_events\": [\n"
    "        \"User opens 'server_log.py' in VS Code.\",\n"
    "        \"User switches to 'config.yaml' to check API settings.\"\n"
    "      ],\n"
    "      \"active_files\": [\"server_log.py\", \"config.yaml\"],\n"
    "      \"visited_urls\": []\n"
    "    },\n"
    "    {\n"
    "      \"start_timestamp\": 3.0,\n"
    "      \"end_timestamp\": 6.0,\n"
    "      \"user_speech\": \"There's an authentication error. Let me check the docs and open Postman.\",\n"
    "      \"screen_events\": [\n"
    "        \"User opens web browser and navigates to API authentication documentation.\",\n"
    "        \"User switches to Postman and tests API credentials.\"\n"
    "      ],\n"
    "      \"active_files\": [\"Postman\"],\n"
    "      \"visited_urls\": [\"https://api.example.com/docs/auth\"]\n"
    "    },\n"
    "    {\n"
    "      \"start_timestamp\": 6.0,\n"
    "      \"end_timestamp\": 8.4,\n"
    "      \"user_speech\": \"Let me verify the request headers in the API client.\",\n"
    "      \"screen_events\": [\n"
    "        \"User switches back to 'server_log.py' to inspect API request parameters.\",\n"
    "        \"User opens 'headers.json' in VS Code.\"\n"
    "      ],\n"
    "      \"active_files\": [\"server_log.py\", \"headers.json\"],\n"
    "      \"visited_urls\": []\n"
    "    }\n"
    "  ],\n"
    "  \"overall_summary\": \"The user debugs an API authentication error by analyzing 'server_log.py', "
    "checking API credentials in Postman, and consulting the API authentication documentation at https://api.example.com/docs/auth. "
    "Throughout the session, the user switches between multiple files, including 'config.yaml' and 'headers.json', to verify API configurations.\",\n"
    "  \"user_intention\": \"Debug the API authentication error in Postman based on the documentation at https://api.example.com/docs/auth. Investigate 'config.yaml' and 'headers.json', to verify API configurations.\"\n"

    "}\n"
    "```\n"
)


# Call the Gemini API with the video file, system prompt, and user prompt.

def reply(video_file) -> VideoSummary:

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[video_file, system_prompt, user_prompt],
        config={
            'response_mime_type': 'application/json',
            'response_schema': VideoSummary,
        },
    )

    # Print the structured JSON output.
    return response.parsed

