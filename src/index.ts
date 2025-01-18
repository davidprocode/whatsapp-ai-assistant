import "dotenv/config";
import { Message, Whatsapp, create as venomCreate } from "venom-bot";
import { OpenAI } from "openai";
import { saveInteraction, getMessageHistory } from "./firebaseService"; // Importando os serviços de Firestore

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
  const sender = message.sender.id;

  // Verifica o tipo de mensagem recebida
  if (message.type === "chat") {
    // Se for uma mensagem de texto, prossegue com o fluxo normal
    await handleTextMessage(client, message);
  } else {
    // Caso contrário, envia uma resposta informando que não há suporte para esse tipo de mensagem
    await client.sendText(
      message.from,
      "🤖: Desculpe, não posso processar este tipo de mensagem (mídia, áudio, figurinhas, etc.). Por enquanto, só consigo responder mensagens de texto."
    );
  }
}

async function handleTextMessage(client: Whatsapp, message: Message) {
  const assistantBehavior = process.env.ASSISTANT_BEHAVIOR;

  const content = message.body.trim();
  const sender = message.sender.id;

  try {
    // Recupera o histórico de mensagens do Firestore
    const messageHistory = await getMessageHistory(sender);

    // Adiciona a nova mensagem ao histórico
    const chatMessages = [
      { role: "system", content: assistantBehavior },
      ...messageHistory,
      { role: "user", content: content },
    ];

    // Criação de uma mensagem para a API do OpenAI com o histórico de mensagens
    const chatResponse = await openai.chat.completions.create({
      model: String(process.env.OPENAI_MODEL),
      messages: chatMessages, // Passando o histórico de mensagens
    });

    // Verificando a resposta da API
    const assistantMessage = chatResponse.choices[0]?.message?.content;
    if (assistantMessage) {
      // Enviando a resposta de volta para o WhatsApp
      await client.sendText(message.from, `🤖: ${assistantMessage}`);

      // Salvando a nova interação no Firestore (usuário e assistente)
      await saveInteraction(sender, content, assistantMessage);
    } else {
      console.error("Nenhuma resposta gerada pelo assistente.");
    }
  } catch (error) {
    console.error("Erro ao interagir com a API do OpenAI:", error);
  }
}
