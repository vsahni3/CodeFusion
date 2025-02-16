from langchain.tools import BaseTool
from pydantic import BaseModel, Field
import subprocess

class TerminalToolInput(BaseModel):
    command: str

class TerminalExecute(BaseTool):
    name="terminal_execute"
    description="Executes commands in the "

    def _run(self):
        cmd: str = ""
        subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            check=True
        )

        pass