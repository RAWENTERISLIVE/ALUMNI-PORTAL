
import os

replacements = {
    "MPSAJMER CONNECT": "MPSAJMER CONNECT",
    "MPSAJMER CONNECT": "MPSAJMER CONNECT",
    "mpsajmer-connect": "mpsajmer-connect",
    "mpsajmer-connect": "mpsajmer-connect",
    "mpsajmer-connect-db": "mpsajmer-connect-db",
    "mpsajmer-connect-uploads": "mpsajmer-connect-uploads"
}

def replace_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for old, new in replacements.items():
            content = content.replace(old, new)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

exclude_dirs = {'.git', 'node_modules', '.wrangler', 'dist'}
exclude_files = {'.DS_Store', 'bun.lockb', 'package-lock.json'}

for root, dirs, files in os.walk('/Users/raghav/Projects/ALUMNI-PORTAL'):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if file not in exclude_files:
            replace_in_file(os.path.join(root, file))
