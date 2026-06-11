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

  const messages = [{ role: "user", content: prompt }];

  const tools = [
    {
      type: "function",
      function: {
        name: "Read",
        description: "Read and return the contents of a file",
        parameters: {
          type: "object",
          properties: {
            file_path: {
              type: "string",
              description: "The path to the file to read",
            },
          },
          required: ["file_path"],
        },
      },
    },
    {
      "type": "function",
      "function": {
        "name": "Write",
        "description": "Write content to a file",
        "parameters": {
          "type": "object",
          "required": ["file_path", "content"],
          "properties": {
            "file_path": {
              "type": "string",
              "description": "The path of the file to write to"
            },
            "content": {
              "type": "string",
              "description": "The content to write to the file"
            }
          }
        }
      }
    }
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: "anthropic/claude-haiku-4.5",
      messages: messages,
      tools: tools,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("no choices in response");
    }

    // You can use print statements as follows for debugging, they'll be visible when running tests.
    const choice = response.choices[0];
    const message = choice.message;

    messages.push({
      role: "assistant",
      content: message.content ?? null,
      ...(message.tool_calls ? { tool_calls: message.tool_calls } : {}),
    });

    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        if (functionName === "Read") {
          const fileContent = fs.readFileSync(args.file_path, "utf-8");
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: fileContent,
          });
        } else if(functionName === "Write") {
          const content = args.content;
          const file_path = args.file_path;
          fs.writeFileSync(file_path, content);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: content,
          });
        }
      }
      continue;
    }

    if (message.content) {
      console.log(message.content);
    }
    break;
  }
  // You can use print statements as follows for debugging, they'll be visible when running tests.
  console.error("Logs from your program will appear here!");

  // // TODO: Uncomment the lines below to pass the first stage
  // console.log(response.choices[0].message.content);
}

main();
