"""Build the offline index from the full English jmdict-simplified JSON on stdin."""
import json
import sys
from collections import defaultdict

dictionary = json.load(sys.stdin)
if dictionary["commonOnly"]:
    raise ValueError("Use the complete dictionary to identify uncommon alternate readings")

readings = defaultdict(set)
common = set()
for entry in dictionary["words"]:
    for spelling in entry["kanji"]:
        word = spelling["text"]
        if len(word) < 2:
            continue
        if spelling["common"]:
            common.add(word)
        for kana in entry["kana"]:
            applies = kana["appliesToKanji"]
            if "*" in applies or word in applies:
                readings[word].add(kana["text"])

index = {word: next(iter(readings[word])) for word in sorted(common) if len(readings[word]) == 1}
json.dump(index, sys.stdout, ensure_ascii=False, indent=0)
print()
