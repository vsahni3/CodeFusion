import os
from typing import Literal

import dotenv
from langchain.docstore.document import Document
from langchain.text_splitter import CharacterTextSplitter
from langchain_iris import IRISVector
from langchain_openai import OpenAIEmbeddings
from markdownify import markdownify as md
from pydantic import BaseModel
from scrapingbee import ScrapingBeeClient


class ContentChunk(BaseModel):
    content: str
    type: Literal['text', 'function']

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
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=300)
    docs = text_splitter.split_documents([Document(page_content=markdown, metadata={'source': url})])
    embeddings = OpenAIEmbeddings()
    db = IRISVector(
        dimension=1536,
        embedding_function=embeddings,
        collection_name='documentation',
        connection_string=connection_string()
    )
    db.add_documents(docs)
    print(f"Number of docs in vector store: {len(db.get()['ids'])}")
    query = "Implement error handling for anthropic streaming API"
    docs_with_score = db.similarity_search_with_score(query, 10)
    for doc, score in docs_with_score:
        print("-" * 80)
        print("Score: ", score)
        print(doc.page_content)
        print("-" * 80)
    

def scrape_website(url: str) -> None:
    html = get_html(url)
    markdown = md(html)
    chunk_and_store_markdown(url, markdown)

def get_k_most_relevant(query: str, k: int) -> list[str]:
    db = IRISVector(
        dimension=1536,
        collection_name='documentation',
        connection_string=connection_string(),
        embedding_function=OpenAIEmbeddings()
    )
    docs_with_score = db.similarity_search_with_score(query, k)
    return [doc.page_content for doc, _ in docs_with_score]

"""
Once we get the list of visited URLs, for each URL we
- scrape
- convert to markdown
- chunk
- embed in the database.

After scraping all URLs, we query the database for the most relevant chunks.
"""

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
    print(docs)

    

if __name__ == "__main__":
    main()