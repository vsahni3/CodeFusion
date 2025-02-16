cd ~/CodeFusion

# git clone https://github.com/LaZeAsh/CodegenAgent-Repo.git app
git clone --depth 1 https://github.com/vsahni3/demo.git

python3 cagent/agent.py # Codegen agent takes care of everything

cd app

git add .

git commit -m "Finished"

# git push --set-upstream origin main
git push --set-upstream origin main

cd ..

rm -rf app

