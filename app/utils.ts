import fs from 'node:fs';
import { execSync } from 'node:child_process';

function performToolCall(toolCall, functionName, args, messages) {
    if (functionName === "Read") {
        const fileContent = fs.readFileSync(args.file_path, "utf-8");
        messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: fileContent,
        });
    } else if (functionName === "Write") {
        const content = args.content;
        const file_path = args.file_path;
        fs.writeFileSync(file_path, content);
        messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: content,
        });
    } else if (functionName === "Bash") {
        let output = "";
        try {
            output = execSync(args.command, { encoding: "utf-8" });
        } catch (err) {
            output = err.stderr ?? err.message;
        }
        messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: output,
        });
    }
    return messages;
}

export { performToolCall }