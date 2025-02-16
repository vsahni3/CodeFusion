from flask import Flask, request, jsonify
import os
import git
from agent import CodeflowAgent
from dotenv import load_dotenv

app = Flask(__name__)
DEMO_DIR = 'demo'
load_dotenv()

# repo_url is the ssh URL of the repository
def setup_repository(repo_url):
    # Extract repository name from URL
    repo_name = repo_url.split('/')[-1].replace('.git', '')
    repo_path = DEMO_DIR
    try:
        if os.path.exists(repo_path):
            # Repository exists, pull latest changes
            repo = git.Repo(repo_path)
            repo.remotes.origin.pull()
        else:
            # Clone new repository
            git.Repo.clone_from(repo_url, repo_path)
    except Exception as e:
        print(f'error {e}')
    return repo_path


@app.route('/process', methods=['POST'])
def process_repository():
    try:
        data = request.get_json()
        if not data or 'repository' not in data:
            return jsonify({'error': 'Repository URL is required'}), 400

        repo_url = data['repository']
        repo_path = setup_repository(repo_url)
        try:
            # Create and run agent
            agent = CodeflowAgent(repo_path)
            result = agent.run()
            
            return jsonify({'result': result}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Ensure demo directory exists
    app.run(debug=True, port=5003)
