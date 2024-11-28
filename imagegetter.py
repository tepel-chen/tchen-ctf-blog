import sys
import re
import requests
from pathlib import Path

def extract_urls(file_path, pattern):
    matches = []
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            matches.extend(re.findall(pattern, line))
    return matches

def download_image(url, output_dir):
    response = requests.get(url, stream=True)
    if response.status_code == 200 and 'image' in response.headers['Content-Type']:
        file_name = url.split("/")[-1]
        output_path = Path(output_dir) / file_name
        with open(output_path, 'wb') as file:
            for chunk in response.iter_content(1024):
                file.write(chunk)
        print(f"Downloaded: {output_path}")
    else:
        print(f"Failed to download or not an image: {url}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]
    output_dir = "tmp_images"

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    pattern = r"!\[\]\(([^)]+)\)"

    urls = extract_urls(file_path, pattern)
    print(urls)
    for url in urls:
        download_image(url, output_dir)