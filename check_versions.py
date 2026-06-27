import json

with open('package-lock.json') as f:
    data = json.load(f)

pkgs = data.get('packages', {})
for pkg, info in pkgs.items():
    if 'lightningcss' in pkg or 'css-interop' in pkg:
        print(f'{pkg}: {info.get("version", "?")}')
