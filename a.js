import fs from 'node:fs';
const response = {
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "Read",
              "arguments": "{\"file_path\": \"/Users/sagnik/personal-workspace/codecrafters-claude-code-typescript/a.js\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ]
}

function parseToolCall(tool_call = {}) {
  const fnName = tool_call?.function?.name;
  const args = JSON.parse(tool_call?.function?.arguments);
  return {fnName, args};
}

function performToolCall(functionName, args) {
  switch (functionName) {
    case 'Read':
      if (!args.file_path) {
        throw new Error("File path mandatory");
      }
      const { file_path } = args;
      fs.readFile(file_path, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(data);
      });
  }
}

const choice = response.choices?.[0];
const { tool_calls = []} = choice?.message;
const {fnName, args} = parseToolCall(tool_calls[0]);

console.log(fnName, args, "\n");
performToolCall(fnName, args);