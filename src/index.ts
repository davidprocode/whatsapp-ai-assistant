import "dotenv/config";
import { Message, Whatsapp, create as venomCreate } from "venom-bot";
import { OpenAI } from "openai";

venomCreate({
  session: "AI-Assistent",
  BrowserFetcher: false,
  browserPathExecutable: process.env.BROWSER_PATH_EXECUTABLE ?? undefined,
  browserWS: undefined,
  browserArgs: ["--headless"],
})
  .then((client) => start(client))
  .catch((error) => {
    console.error(error);
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
  const content = message.body.trim();
  const sender = message.sender.id;

  try {
    // Criação de uma mensagem para a API do OpenAI
    const chatResponse = await openai.chat.completions.create({
      model: String(process.env.OPENAI_MODEL),
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    });

    // Verificando a resposta da API
    const assistantMessage = chatResponse.choices[0]?.message?.content;
    if (assistantMessage) {
      // Enviando a resposta de volta para o WhatsApp
      await client.sendText(message.from, `🤖: ${assistantMessage}`);
    } else {
      console.error("Nenhuma resposta gerada pelo assistente.");
    }
  } catch (error) {
    console.error("Erro ao interagir com a API do OpenAI:", error);
  }
}
