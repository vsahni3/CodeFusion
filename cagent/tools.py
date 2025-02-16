"""Tools for running bash commands."""

import re
import shlex
import subprocess
from typing import Any

# Whitelist of allowed commands and their flags
ALLOWED_COMMANDS = {
    "ls": {"-l", "-a", "-h", "-t", "-r", "--color"},
    "cd": set(),
    "cat": {"-n", "--number"},
    "head": {"-n"},
    "tail": {"-n", "-f"},
    "grep": {"-i", "-r", "-n", "-l", "-v", "--color"},
    "find": {"-name", "-type", "-size", "-mtime"},
    "pwd": set(),
    "echo": set(),  # echo is safe with any args,
    "python3": set(),
    "python": set(),
    "curl": set(),
    "ps": {"-ef", "-aux"},
    "df": {"-h"},
    "du": {"-h", "-s"},
    "wc": {"-l", "-w", "-c"},
}

def validate_command(command: str) -> tuple[bool, str]:
    """Validate if a command is safe to execute.

    Args:
        command: The command to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Check for dangerous patterns first, before splitting
        dangerous_patterns = [
            (r"[|;&`$]", "shell operators (|, ;, &, `, $)"),
            (r"rm\s", "remove command"),
            (r">\s", "output redirection"),
            (r">>\s", "append redirection"),
            (r"<\s", "input redirection"),
            (r"\.\.", "parent directory traversal"),
            (r"sudo\s", "sudo command"),
            (r"chmod\s", "chmod command"),
            (r"chown\s", "chown command"),
            (r"mv\s", "move command"),
            (r"cp\s", "copy command"),
        ]

        for pattern, description in dangerous_patterns:
            if re.search(pattern, command):
                return False, f"Command contains dangerous pattern: {description}"

        # Split command into tokens while preserving quoted strings
        tokens = shlex.split(command)
        if not tokens:
            return False, "Empty command"

        # Get base command (first token)
        base_cmd = tokens[0]

        # Check if base command is in whitelist
        if base_cmd not in ALLOWED_COMMANDS:
            return False, f"Command '{base_cmd}' is not allowed. Allowed commands: {', '.join(sorted(ALLOWED_COMMANDS.keys()))}"

        # Extract and split combined flags (e.g., -la -> -l -a)
        flags = set()
        for token in tokens[1:]:
            if token.startswith("-"):
                if token.startswith("--"):
                    # Handle long options (e.g., --color)
                    flags.add(token)
                else:
                    # Handle combined short options (e.g., -la)
                    # Skip the first "-" and add each character as a flag
                    for char in token[1:]:
                        flags.add(f"-{char}")

        allowed_flags = ALLOWED_COMMANDS[base_cmd]

        # For commands with no flag restrictions (like echo), skip flag validation
        if allowed_flags:
            invalid_flags = flags - allowed_flags
            if invalid_flags:
                return False, f"Flags {invalid_flags} are not allowed for command '{base_cmd}'. Allowed flags: {allowed_flags}"

        return True, ""

    except Exception as e:
        return False, f"Failed to validate command: {e!s}"


def run_bash_command(commands: list[str], is_background: bool = False) -> dict[str, Any]:
    """Run a bash command and return its output.

    Args:
        command: The command to run
        is_background: Whether to run the command in the background

    Returns:
        Dictionary containing the command output or error
    """
    # First validate the command
    for command in commands:
        is_valid, error_message = validate_command(command)
        if not is_valid:
            return {
                "status": "error",
                "error": f"Invalid command: {error_message}",
            }

    try:
        if is_background:
            # For background processes, we use Popen and return immediately
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            return {
                "status": "success",
                "message": f"Command '{command}' started in background with PID {process.pid}",
            }

        # For foreground processes, we wait for completion
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            check=True,  # This will raise CalledProcessError if command fails
        )

        return {
            "status": "success",
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.CalledProcessError as e:
        return {
            "status": "error",
            "error": f"Command failed with exit code {e.returncode}",
            "stdout": e.stdout,
            "stderr": e.stderr,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": f"Failed to run command: {e!s}",
        }
