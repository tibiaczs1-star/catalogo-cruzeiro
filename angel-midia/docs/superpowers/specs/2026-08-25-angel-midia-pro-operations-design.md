# Angel Mídia Pro — Central de Operações

## Resultado aprovado

Transformar o painel atual em uma central operacional profissional para redes de TVs, sem apagar o que já funciona. A primeira entrega conecta painel, API e APK TV para o administrador enxergar a saúde real dos aparelhos e executar ações remotas seguras.

O produto permanece azul e branco, com cores sólidas, sem degradês. Ciano, verde, âmbar e vermelho são reservados a estados operacionais. O visual usa cartões compactos, ícones consistentes, pequenas sombras e profundidade discreta; nenhum enfeite pode competir com os dados.

## Fluxo principal

1. O APK TV envia telemetria junto do heartbeat: estado do player, mídia atual, último sincronismo, última reprodução, versão, armazenamento e erro recente.
2. A API consolida esses sinais em um retrato operacional determinístico e classifica cada TV como online, instável ou offline.
3. A Central de TVs mostra resumo da rede, alertas e uma lista compacta com o conteúdo em exibição.
4. O administrador pode solicitar `sincronizar`, `reiniciar player` ou `limpar cache`.
5. O APK consulta uma fila pequena, executa apenas comandos conhecidos e confirma sucesso ou falha.
6. O painel atualiza o estado e mantém histórico suficiente para o operador entender a causa, tentar novamente ou parar.

## Contrato de ação

As ações remotas seguem o princípio de um harness pequeno e inequívoco:

- `refresh_sync`: atualiza programação e mídia sem reiniciar o aplicativo.
- `restart_player`: recria o ciclo de reprodução preservando autenticação e cadastro.
- `clear_media_cache`: remove somente cache de mídia e sincroniza novamente.

Nenhuma ação aceita shell, URL arbitrária ou payload aberto. Respostas e erros têm formato estável, com identificador, estado, causa curta e timestamps. Comandos expiram e são idempotentes no reconhecimento; uma TV nunca executa comando de outro dispositivo.

## Dados e classificação

A migração cria `device_remote_commands`, separada da tabela legada `device_commands` usada por versões de programação, e mantém `devices` compatível com a versão atual.

O retrato por TV inclui: identificação, local, coordenadas, conexão, player, mídia atual, último heartbeat, versão, espaço livre, erro recente, quantidade de comandos pendentes e alerta calculado. O último sincronismo e a última reprodução entram quando o APK passar a enviar esses sinais; a tela não inventa valores ausentes.

- online: heartbeat com até 90 segundos;
- instável: heartbeat entre 90 segundos e 10 minutos, player em sincronização/erro ou armazenamento baixo;
- offline: heartbeat ausente ou mais antigo que 10 minutos;
- armazenamento baixo: menos de 512 MiB livres.

## Interface

A nova navegação chama a área de `Central de TVs`. A primeira dobra contém quatro cartões sólidos: online, instáveis, offline e atenção. Em seguida há filtros por estado, busca e atualização manual. Cada linha/cartão de TV mostra:

- nome, empresa/local e indicador de conexão;
- miniatura ou tipo da mídia atual;
- estado do player e tempo desde a última comunicação;
- versão e armazenamento;
- alerta prioritário, quando houver;
- ações remotas com feedback de envio e resultado.

No celular, os dados viram cartões de uma coluna; no desktop, uma grade/lista densa. O modo noturno e as preferências do HUD existentes continuam válidos. O asset Higgsfield será apenas uma ilustração operacional de apoio em estado vazio/introdução, com fundo transparente ou branco e paleta sólida; funções e ícones críticos continuam em HTML/SVG acessível.

## APK TV

O APK recebe no sincronismo o comando remoto mais antigo enquanto está ativo, sem bloquear a reprodução. `refresh_sync` avança a geração de playback e busca a programação. `restart_player` encerra o slot atual e recria o ciclo. `clear_media_cache` remove apenas arquivos de mídia conhecidos dentro de `cacheDir`, preserva credenciais e reinicia a sincronização.

Falhas de rede usam recuo e não interrompem o conteúdo já baixado. A confirmação informa `completed` ou `failed` com resumo curto e código conhecido, nunca stack trace ou dado sensível.

## Segurança e limites desta entrega

- autenticação de administrador para leitura e criação de comandos;
- autenticação do dispositivo para heartbeat, polling e confirmação;
- tipos, estados, UUIDs e tamanhos de texto validados;
- acesso limitado ao próprio dispositivo;
- sem captura remota de tela, instalação silenciosa de APK, shell remoto ou atualização de firmware nesta fase;
- sem push ou deploy externo sem autorização explícita.

## Verificação

A entrega só é considerada pronta após: testes vermelhos antes da implementação, suítes completas da API e painel, testes unitários Android, build dos dois APKs, inspeção visual local nos breakpoints desktop/celular e confirmação de que nenhuma credencial ou alteração externa foi introduzida.
