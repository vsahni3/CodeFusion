from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin  # Import CORS handling
from langchain.docstore.document import Document
from markdownify import markdownify as md
from process_video import VideoSummary, VideoSummarySegment, reply, upload_video
from scrape import chunk_and_store_markdown, get_html, get_k_most_relevant

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB

def format_segment(segment: VideoSummarySegment) -> str:
    return f"""\
{segment.user_speech}

Screen Events: {segment.screen_events}
Visited Files: {segment.active_files}
Visited URLs: {segment.visited_urls}
"""

def format_segments(segments: list[VideoSummarySegment]) -> str:
    return '\n'.join([format_segment(segment) for segment in segments])

def format_doc(doc: Document) -> str:
    return f"""\
{doc.page_content}

URL: {doc.metadata['source']}
"""

def format_docs(docs: list[Document]) -> str:
    return '\n'.join([format_doc(doc) for doc in docs])

def format_instructions(summary: VideoSummary, docs: list[Document]) -> str:
    return f"""\
Intention: {summary.user_intention}

Summary: {summary.overall_summary}

Segments: 
{format_segments(summary.segments)}

Docs: 
{format_docs(docs)}
"""


@app.route('/respond', methods=['POST'])
def respond():
    print('Received request for /respond')
    video = request.files['video']
    video = upload_video(video)
    response = reply(video)
    urls = set()
    for snapshot in response.segments:
        for url in snapshot.visited_urls:
            urls.add(url)

    for url in urls:
        html = get_html(url)
        markdown = md(html)
        chunk_and_store_markdown(url, markdown)
    query = response.user_intention
    docs_with_score = get_k_most_relevant(query, 20)
    docs = [doc[0] for doc in docs_with_score]
    instructions = format_instructions(response, docs)
    return jsonify({"response": instructions}), 200


@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Hello, World!"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5002)


