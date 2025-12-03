#!/bin/bash
cd /Users/hetavimehta/Desktop/ASU_Acad/Fall2025/CSE540/Project/supply-chain-provenance/client
export BROWSER=none
npm start 2>&1 | while IFS= read -r line; do
  echo "$line"
  if [[ "$line" == *"Compiled successfully"* ]]; then
    echo ""
    echo "✅ SERVER STARTED! Go to: http://localhost:3000"
    echo ""
  fi
  if [[ "$line" == *"Local:"* ]]; then
    echo "$line"
  fi
done
