import subprocess

def execute_commands_from_file(file_path):
    """
    Reads each line from the given text file as a shell command, executes it,
    and prints the output or error for each command.
    
    Parameters:
      file_path (str): Path to the text file containing shell commands.
    """
    try:
        with open(file_path, 'r') as file:
            # Get non-empty lines (stripped of whitespace)
            commands = [line.strip() for line in file if line.strip()]
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return

    for cmd in commands:
        print(f"\nExecuting command: {cmd}")
        # Execute the command
        process = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        # Check if the command ran successfully
        if process.returncode != 0:
            print(f"[ERROR] Command failed: {cmd}")
            print(f"Error message: {process.stderr.strip()}")
        else:
            print(f"[SUCCESS] Command succeeded: {cmd}")
            if process.stdout.strip():
                print(f"Output: {process.stdout.strip()}")

# Example usage:
execute_commands_from_file('demo/cmds.txt')
