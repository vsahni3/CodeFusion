from langchain_openai import ChatOpenAI
from codegen import Codebase
from codegen.extensions.langchain.agent import create_codebase_agent
from dotenv import load_dotenv
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
import uuid
import os

load_dotenv()


# class TestingTool(BaseTool):
#     name = "testing_tool"
#     description = "Tool writes test cases for the code written in a `codefusion-tests.py` file"

#     def _run(self):
        
#         ChatOpenAI()

#         pass

class CodeflowAgent:
    def __init__(self):
        self.codebase = Codebase("app/")
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

        config_path = "app/codefusion.config"

        input = ""

        with open(config_path, 'r') as config_file:
            config_contents = config_file.read()
            config_contents = config_contents.split("***")

            print(config_contents)

            input += "QUERY:\n"
            input += config_contents[0]

            input += "DOCUMENTATION:\n"
            input += config_contents[1]
        
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
    print(agent.run())
