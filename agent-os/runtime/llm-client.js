/**
 * Agent OS — Cliente LLM
 *
 * Conecta-se ao Ollama local (Fable 5.0 / :3b / gemma4:12b)
 * para executar agentes especializados via API de chat completions.
 *
 * Uso:
 *   const client = new LlmClient();
 *   const response = await client.chat(messages, options);
 */

const https = require("node:https");
const http = require("node:http");

class LlmClient {
  constructor() {
    this.baseUrl =
      process.env.AGENT_OS_LLM_URL ||
      process.env.LLM_API_URL ||
      process.env.OLLAMA_BASE_URL ||
      "http://127.0.0.1:11434/v1/chat/completions";
    this.model =
      process.env.AGENT_OS_LLM_MODEL ||
      process.env.LLM_MODEL ||
      process.env.CZS_OLLAMA_MODEL ||
      ":3b";
    this.authToken = String(process.env.OLLAMA_AUTH_TOKEN || "").trim();
    this.timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS || "90000", 10);
    this._healthy = null;
    this._lastCheck = 0;
    this._healthCacheMs = 30000;
  }

  isHttp(url) {
    return url.startsWith("http://");
  }

  request(url, body = null, method = "POST") {
    return new Promise((resolve, reject) => {
      const lib = this.isHttp(url) ? http : https;
      const data = body === null ? "" : JSON.stringify(body);
      const req = lib.request(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Content-Length": Buffer.byteLength(data),
          ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        },
        timeout: this.timeoutMs,
      }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          try {
            resolve({ status: res.statusCode, data: JSON.parse(text) });
          } catch {
            resolve({ status: res.statusCode, data: text });
          }
        });
      });
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Timeout em ${url} após ${this.timeoutMs}ms`));
      });
      if (data) req.write(data);
      req.end();
    });
  }

  async healthCheck() {
    const now = Date.now();
    if (this._healthy !== null && now - this._lastCheck < this._healthCacheMs) {
      return this._healthy;
    }
    this._lastCheck = now;
    try {
      const tagsUrl = new URL("/api/tags", this.baseUrl).toString();
      const r = await this.request(tagsUrl, null, "GET");
      this._healthy = r.status === 200;
    } catch {
      this._healthy = false;
    }
    return this._healthy;
  }

  async chat(messages, options = {}) {
    const model = options.model || this.model;
    const temperature = options.temperature ?? 0.3;
    const maxTokens = options.max_tokens || 2000;
    const body = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };
    const r = await this.request(this.baseUrl, body);
    if (!r.status || r.status < 200 || r.status >= 300) {
      throw new Error(`LLM retornou HTTP ${r.status}: ${JSON.stringify(r.data).slice(0, 200)}`);
    }
    const content = r.data?.choices?.[0]?.message?.content || "";
    return { content, raw: r.data, model, status: r.status };
  }

  async runAgent(agentManifest, context) {
    const systemPrompt = this.buildSystemPrompt(agentManifest);
    const userPrompt = this.buildUserPrompt(agentManifest, context);
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];
    const result = await this.chat(messages, {
      model: agentManifest.llmModel || this.model,
      temperature: agentManifest.temperature ?? 0.3,
      max_tokens: agentManifest.maxTokens || 2000,
    });
    return {
      agentId: agentManifest.id,
      agentName: agentManifest.name,
      content: result.content,
      status: "completed",
      timestamp: new Date().toISOString(),
    };
  }

  buildSystemPrompt(manifest) {
    const lines = [
      `Você é ${manifest.name}.`,
      `Cargo: ${manifest.cargo}.`,
      `Especialidade: ${manifest.specialty || manifest.description || ""}`,
      "",
      "## Regras",
      "- Responda SOMENTE sobre sua área de especialidade.",
      "- Seja conciso e objetivo.",
      "- Use formato Markdown.",
      "- Nunca invente dados. Se não souber, diga.",
      "- Nunca exponha chaves, tokens ou senhas.",
      "- Responda em português brasileiro.",
    ];
    if (manifest.subroutines && manifest.subroutines.length) {
      lines.push("", "## Suas Sub-rotinas", ...manifest.subroutines.map((s, i) => `${s}`));
    }
    if (manifest.permissions && manifest.permissions.length) {
      lines.push("", "## Permissões", ...manifest.permissions.map(p => `- ${p}`));
    }
    if (manifest.limitations && manifest.limitations.length) {
      lines.push("", "## Limitações", ...manifest.limitations.map(l => `- ${l}`));
    }
    if (manifest.protocols && manifest.protocols.length) {
      lines.push("", "## Protocolos", ...manifest.protocols.map(p => `- ${p}`));
    }
    if (manifest.metrics && manifest.metrics.length) {
      lines.push("", "## Métricas de Sucesso", ...manifest.metrics.map(m => `- ${m}`));
    }
    if (manifest.context) {
      lines.push("", "## Contexto Atual", manifest.context);
    }
    return lines.join("\n");
  }

  buildUserPrompt(manifest, context) {
    const parts = [];
    if (context?.task) {
      parts.push(`## Tarefa\n${context.task}`);
    }
    if (context?.data) {
      parts.push(`## Dados\n${JSON.stringify(context.data, null, 2)}`);
    }
    if (context?.question) {
      parts.push(`## Pergunta\n${context.question}`);
    }
    if (manifest.workingPrompt) {
      parts.push(`## Diretrizes\n${manifest.workingPrompt}`);
    }
    parts.push("", "## Formato de Resposta", "Forneça um relatório estruturado com: achados, análise e recomendações.");
    return parts.join("\n\n");
  }
}

module.exports = { LlmClient };
