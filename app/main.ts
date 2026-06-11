import OpenAI from "openai";
import fs from 'node:fs';

function parseToolCall(tool_call = {}) {
  const fnName = tool_call?.function?.name || '';
  const args = (typeof tool_call?.function?.arguments === 'string') ? JSON.parse(tool_call?.function?.arguments) : [];
  return { fnName, args };
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

async function main() {
  const [, , flag, prompt] = process.argv;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (flag !== "-p" || !prompt) {
    throw new Error("error: -p flag is required");
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
  });

  const response = await client.chat.completions.create({
    model: "anthropic/claude-haiku-4.5",
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        "type": "function",
        "function": {
          "name": "Read",
          "description": "Read and return the contents of a file",
          "parameters": {
            "type": "object",
            "properties": {
              "file_path": {
                "type": "string",
                "description": "The path to the file to read"
              }
            },
            "required": ["file_path"]
          }
        }
      }
    ]
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error("no choices in response");
  }

  if (response.choices) {
    const choice = response.choices?.[0];
    const { tool_calls = [] } = choice?.message;
    if (tool_calls) {
      const { fnName, args } = parseToolCall(tool_calls[0]);
      performToolCall(fnName, args);
    } else {
      console.error("No tool call found for this command", tool_calls);
    }
  }

  // You can use print statements as follows for debugging, they'll be visible when running tests.
  console.error("Logs from your program will appear here!");

  // // TODO: Uncomment the lines below to pass the first stage
  // console.log(response.choices[0].message.content);
}

main();
