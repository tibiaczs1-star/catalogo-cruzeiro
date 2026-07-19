# Agent OS — ponte segura Render/Ollama

## Objetivo

Permitir que o Agent OS hospedado no Render use o modelo local `llama3.2:3b` sem expor diretamente a porta do Ollama e sem voltar silenciosamente ao fallback quando a URL temporária do túnel mudar.

## Arquitetura

O Ollama continua acessível somente em `127.0.0.1:11434`. Um proxy Node local escuta apenas em `127.0.0.1:11435`, exige um token Bearer de alta entropia e encaminha exclusivamente as rotas necessárias do Ollama. O Cloudflare Quick Tunnel publica apenas esse proxy.

O iniciador do túnel gera ou reutiliza o token local, baixa o `cloudflared` em diretório temporário do projeto, inicia proxy e túnel, descobre a nova URL pública e atualiza no Render `AGENT_OS_LLM_URL`, `OLLAMA_BASE_URL`, `OLLAMA_AUTH_TOKEN` e os modelos como `llama3.2:3b`. Depois dispara um deploy e acompanha a ativação.

O cliente LLM do Agent OS envia o mesmo Bearer em todas as chamadas, inclusive na verificação de saúde. Assim, uma URL pública sem token não dá acesso ao modelo.

## Compatibilidade de API

O proxy aceita:

- `POST /v1/chat/completions`, encaminhado para a rota OpenAI compatível do Ollama;
- `GET /api/tags`, usado para verificar disponibilidade;
- `GET /health`, que confirma apenas a saúde do proxy e não revela modelos ou credenciais.

Demais métodos e rotas retornam `404`; autenticação ausente ou inválida retorna `401`; o corpo das requisições tem limite de tamanho.

## Recuperação e operação

O processo supervisor mantém proxy e túnel vivos. Se um processo filho terminar, o supervisor reinicia o conjunto, obtém a nova URL e sincroniza novamente o Render. O estado local registra somente URL, horário, porta e modelo; nunca grava o token no arquivo de estado.

A persistência no Windows será feita por tarefa agendada no logon do usuário, executada sem janela visível e apontando para o checkout operacional. Ela não abre a porta `11434` na rede local.

## Falhas e segurança

- Sem token Render, o túnel pode ser iniciado localmente, mas a sincronização externa falha de forma explícita.
- Sem Ollama ou sem `llama3.2:3b`, não há deploy e o erro é registrado.
- Se a sincronização do Render falhar, o supervisor mantém o proxy protegido e tenta novamente com espera limitada.
- Tokens, chaves e respostas do modelo não aparecem em logs nem em arquivos versionados.
- Não será criado túnel Cloudflare nomeado, pois isso exigiria credenciais e domínio que não estão no escopo atual.

## Verificação

1. Teste automatizado comprova `401` sem token e sucesso autenticado nas rotas necessárias.
2. Teste automatizado comprova que o cliente Agent OS envia Bearer.
3. Suíte completa do repositório permanece verde.
4. Smoke local consulta o `llama3.2:3b` através do proxy.
5. Smoke público executa um ciclo do Agent OS no Render e comprova ao menos uma resposta real, sem novo fallback por indisponibilidade do LLM.
6. Reinício controlado do túnel comprova atualização da URL e recuperação.

## Limite operacional

O Render só alcança o modelo enquanto este computador, o Ollama e a conexão com a internet estiverem ativos. A tarefa agendada recupera reinícios do Windows, mas não transforma o computador local em infraestrutura com disponibilidade de datacenter.
