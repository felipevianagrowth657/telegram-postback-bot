// api/postback.js
// Recebe o postback da corretora (Shiver) e manda a mensagem formatada pro Telegram.
//
// URL de exemplo pra colar no painel de postback de cada expert:
//   https://SEU-PROJETO.vercel.app/api/postback?evento=cadastro&expert=Guilherme+Betti
//   https://SEU-PROJETO.vercel.app/api/postback?evento=ftd&expert=PH+Marques&amount={amount}
//   https://SEU-PROJETO.vercel.app/api/postback?evento=redeposito&expert=Portinelli&amount={amount}
//
// "evento" aceita: cadastro | ftd | redeposito
// Troque {amount} pela macro que o painel de cada corretora usa (confirmar no "Criar postback").

export default async function handler(req, res) {
  const { evento, expert, amount } = req.query;

  if (!evento || !expert) {
    return res.status(400).json({ ok: false, error: "Parâmetros 'evento' e 'expert' são obrigatórios." });
  }

  const nomeExpert = decodeURIComponent(String(expert).replace(/\+/g, " "));
  const valor = amount ? Number(amount).toFixed(2) : null;

  let mensagem;
  switch (evento) {
    case "cadastro":
      mensagem = `🟢 *NOVO Cadastro na SHIVER*\nExpert: ${nomeExpert}`;
      break;
    case "ftd":
      mensagem = `💰 *NOVO FTD na SHIVER · $ ${valor ?? "0.00"}*\nExpert: ${nomeExpert}`;
      break;
    case "redeposito":
      mensagem = `🔄 *Redepósito SHIVER · $ ${valor ?? "0.00"}*\nExpert: ${nomeExpert}`;
      break;
    default:
      return res.status(400).json({ ok: false, error: `Evento desconhecido: ${evento}` });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados." });
  }

  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensagem,
        parse_mode: "Markdown",
      }),
    });

    const data = await resp.json();

    if (!data.ok) {
      console.error("Erro Telegram:", data);
      return res.status(502).json({ ok: false, error: data.description || "Erro ao enviar pro Telegram." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ ok: false, error: "Erro interno." });
  }
}
