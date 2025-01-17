import "dotenv/config";
import { Message, Whatsapp, create as venomCreate } from "venom-bot";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

venomCreate({
  session: "AI-Assistent",
  BrowserFetcher: false,
  browserPathExecutable: process.env.BROWSER_PATH_EXECUTABLE ?? undefined,
  browserWS: undefined,
  browserArgs: ["--headless"],
})
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

const openai = new OpenAI({
  apiKey: String(process.env.OPENAI_API_KEY),
});

async function start(client: Whatsapp) {
  client.onMessage(async (message) => {
    await handleMessage(client, message);
  });
}
async function handleMessage(client: Whatsapp, message: Message) {
  if (message?.body) {
    const sender = message.sender;
    const senderid = message.sender.id;
    const senderShortName = message.sender.shortName;
    const timestamp = message.timestamp;
    const content = `${message.body}`.trim();

    if (process.env.ENV === "Env") {
      console.log(`
        _______________________________
  
        Sender Name: ${senderShortName}
        Sender ID: ${senderid}
        Content: ${content}
        timestamp: ${timestamp}
        _______________________________
        `);
    }

    const messagesMemory: ChatCompletionMessageParam[] = [
      { role: "system", content: `${process.env.TEMPLATE_COMMAND}` },
    ];

    messagesMemory.push({ role: "user", content: content });
    await saveUserMessage(senderid, { role: "user", content: content });

    const response = await openai.chat.completions.create({
      model: String(process.env.OPENAI_MODEL),
      temperature: Number(process.env.OPENAI_TEMPERATURE),
      stream: false,
      user: senderid,
      messages: messagesMemory,
    });

    client
      .sendText(message.from, `🤖: ${response.choices[0].message.content}`)
      .then(async (result: any) => {
        messagesMemory.push({
          role: "assistant",
          content: response.choices[0].message.content,
        });
        await saveGPTMessage(senderid, {
          role: "user",
          content: response.choices[0].message.content ?? "",
        });
      })
      .catch((erro: any) => {
        console.error("Error when sending: ", erro);
      });
  }
}

async function saveUserMessage(
  senderid: string,
  arg0: { role: string; content: string }
) {
  console.log(senderid);
  console.log("Save User:", arg0.content);
}

async function saveGPTMessage(
  senderid: string,
  arg0: { role: string; content: string }
) {
  console.log(senderid);
  console.log("Save GPT:", arg0.content);
}
