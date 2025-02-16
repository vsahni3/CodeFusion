import argparse
import os
from typing import Literal

import dotenv
import openai
from langchain.docstore.document import Document
from langchain.text_splitter import CharacterTextSplitter
from langchain_iris import IRISVector
from langchain_openai import OpenAIEmbeddings
from markdownify import markdownify as md
from pydantic import BaseModel
from scrapingbee import ScrapingBeeClient


class PageContent:
    url: str # URL of the page
    content: str # markdown content of the page
    title: str # title of the page 



dotenv.load_dotenv()

def get_html(url: str) -> str:
    scrapingbee_api_key = os.getenv('SCRAPINGBEE_API_KEY')
    if not scrapingbee_api_key:
        raise ValueError("SCRAPINGBEE_API_KEY is not set")
    client = ScrapingBeeClient(api_key=scrapingbee_api_key)

    response = client.get(url, params={
      'wait': 40,
      'wait_browser': 'networkidle0',
      'block_resources': False
    })
    return response.text

def connection_string() -> str:
    username = 'demo'
    password = 'demo'   
    hostname = os.getenv('IRIS_HOSTNAME', 'localhost')
    port = '1972' 
    namespace = 'USER'
    return f"iris://{username}:{password}@{hostname}:{port}/{namespace}"

def chunk_and_store_markdown(url: str, markdown: str) -> None:
    openai_client = openai.Client()
    completion = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant who takes in a URL and returns a brief description of what the page is likely about."},
            {"role": "user", "content": f"What is the page located at {url} about?"}
        ]
    )
    summary = completion.choices[0].message.content
    text_splitter = CharacterTextSplitter(chunk_size=2000, chunk_overlap=500)
    docs = text_splitter.split_documents([Document(page_content=markdown, metadata={'source': url})])
    for doc in docs:
        doc.page_content = f"""\
Page Context: 
{url}
{summary}

Chunk Content:
{doc.page_content}
"""
    embeddings = OpenAIEmbeddings()
    db = IRISVector(
        dimension=1536,
        embedding_function=embeddings,
        collection_name='documentation',
        connection_string=connection_string()
    )
    db.add_documents(docs)
    print(f"Number of docs in vector store: {len(db.get()['ids'])}")

    
def flush_database():
    db = IRISVector(
        dimension=1536,
        collection_name='documentation',
        connection_string=connection_string(),
        embedding_function=OpenAIEmbeddings()
    )
    db.delete(db.get()['ids'])

def scrape_website(url: str) -> None:
    html = get_html(url)
    markdown = md(html)
    chunk_and_store_markdown(url, markdown)

def get_k_most_relevant(query: str, k: int) -> list[tuple[Document, float]]:
    db = IRISVector(
        dimension=1536,
        collection_name='documentation',
        connection_string=connection_string(),
        embedding_function=OpenAIEmbeddings()
    )
    docs_with_score = db.similarity_search_with_score(query, k)
    return docs_with_score

"""
Once we get the list of visited URLs, for each URL we
- scrape
- convert to markdown
- chunk
- embed in the database.

After scraping all URLs, we query the database for the most relevant chunks.
"""


def test_retrieval():
    files = ['data/anthropic_reference.md', 'data/openai_reference.md']
    flush_database()
    for file in files:
        with open(file, 'r') as f:
            markdown = f.read()
            chunk_and_store_markdown(file, markdown)
    query = "How do I do streaming with the OpenAI API?"
    docs = get_k_most_relevant(query, 1)
    for doc, score in docs:
        print("-" * 80)
        print("Score: ", score)
        print(doc.page_content)
        print("-" * 80)

def main():
    urls = [
        'https://platform.openai.com/docs/api-reference/introduction',
        'https://docs.anthropic.com/en/api/getting-started',
    ]
    for i, url in enumerate(urls):
        html = get_html(url)
        markdown = md(html)
        with open(f'doc_{i}.md', 'w') as f:
            f.write(markdown)
        chunk_and_store_markdown(url, markdown)
    
    # query the database for the most relevant chunks
    query = "How do I do streaming with the OpenAI API?"
    docs = get_k_most_relevant(query, 10)
    for doc in docs:
        print(doc)

def parse_args():
    parser = argparse.ArgumentParser(description="Scrape and store documentation")
    parser.add_argument("--test-retrieval", action="store_true", help="Test retrieval of stored documentation")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    if args.test_retrieval:
        test_retrieval()
    else:
        main()