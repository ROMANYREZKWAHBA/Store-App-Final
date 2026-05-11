
import os

file_path = r'c:\Users\Romany\Desktop\New folder (3)\StoreApp\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# indices are line_number - 1
# Remove 1008 to 1833 (inclusive)
# That is indices 1007 to 1832
from itertools import islice
lines_part1 = list(islice(lines, 0, 1007))
lines_part2 = list(islice(lines, 1833, None))
new_lines = lines_part1 + lines_part2

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Removed {1833-1008+1} lines. New total: {len(new_lines)}")
