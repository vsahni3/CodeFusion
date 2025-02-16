cd ~/Documents/CodeFusion/cagent # My laptop specific

# git clone https://github.com/LaZeAsh/CodegenAgent-Repo.git app
git clone https://github.com/LaZeAsh/BluHacks app

python3 main.py # Codegen agent takes care of everything

cd app

git add .

git commit -m "Finished"

# git push --set-upstream origin main
git push --set-upstream origin Denis

cd ..

rm -rf app

