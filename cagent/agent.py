from langchain_openai import ChatOpenAI
from codegen import Codebase
from codegen.extensions.langchain.agent import create_codebase_agent

from dotenv import load_dotenv
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
import uuid
import os

load_dotenv()
dir = 'demo'

class CodeflowAgent:
    def __init__(self):
        self.codebase = Codebase(f'{dir}/')
        self.agent = create_codebase_agent (
            codebase=self.codebase,
            model_name="gpt-4o",
            temperature=0,
            verbose=True
        )
    
    # def validate_output(self, session_id: str) -> bool:
    #     prompt = "If you edited the code write test cases for the code in a tests.py file"
    #     self.agent.invoke(
    #         {
    #             "input": prompt 
    #         },
    #         config={"configurable": {"session_id": session_id}}
    #     )

    #     exists = os.path.exists("tests.py") # boolean, true if exists

    #     if exists:
    #         pass


    #     return True 
    
            
        
        
        
    def run(self) -> str:
        # Extract important information from app directory

        config_path = f"{dir}/codefusion.config"

        input = ""

        with open(config_path, 'r') as config_file:
            input = config_file.read()
            
        
        print(input)

        session_id = uuid.uuid4()
        result = self.agent.invoke(
            {
                "input": input,
            },
            config={"configurable": {"session_id": session_id}}
        )
            

        return result["output"]




if __name__ == '__main__':
    agent = CodeflowAgent()
    # print(agent.run())
    print(agent.run())