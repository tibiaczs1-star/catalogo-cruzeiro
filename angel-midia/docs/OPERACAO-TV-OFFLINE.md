# Angel Mídia TV — inicialização e operação offline

## O que o APK faz

- Abre a tela de reprodução automaticamente depois que o Android TV ou TV Box termina de ligar.
- Abre novamente após uma atualização do próprio APK.
- Mantém somente uma instância do player aberta.
- Salva a posição da mídia em reprodução a cada 5 segundos e ao sair do aplicativo.
- Retoma o vídeo salvo, quando ele ainda pertence à programação vigente e o registro tem menos de 24 horas.
- Continua exibindo as mídias já baixadas quando a internet cai.
- Tenta restabelecer a sincronização em segundo plano a cada 15 segundos.
- Volta para a programação online no fim da mídia atual, evitando um corte brusco na tela.

## Primeira instalação

1. Instale o APK Angel Mídia TV.
2. Abra o aplicativo manualmente uma vez.
3. Vincule a TV ao painel administrativo.
4. Mantenha a internet ativa até a programação ser sincronizada e as mídias serem baixadas.
5. Depois disso, reinicie o aparelho para confirmar a abertura automática.

O Android não entrega o evento de inicialização a um aplicativo que acabou de ser instalado e nunca foi aberto. A primeira abertura manual é necessária somente após a instalação inicial.

## Em caso de queda da internet

O player usa a última programação salva e reproduz apenas os arquivos que já estão no armazenamento privado do aplicativo. A tela indica **Modo offline · mídia salva**. A internet é testada novamente em segundo plano; quando voltar, a programação é atualizada automaticamente.

Se nenhuma mídia tiver sido baixada antes da queda, o aplicativo permanece na tela de espera e continua tentando reconectar. O modo offline não inventa nem transmite um arquivo incompleto.

## Retomada depois de desligamento

O ponto de reprodução é salvo localmente. Ao ligar novamente, o aplicativo procura a mesma mídia na programação e retoma o vídeo perto do ponto salvo. Imagens estáticas recomeçam normalmente. Registros com mais de 24 horas ou mídias removidas da programação são descartados por segurança.

## Permissões Android

O APK solicita somente:

- **Internet**: sincronização, telemetria e download de mídia.
- **Vibração**: resposta de interface, quando suportada pelo aparelho.
- **Inicialização concluída**: abertura automática depois que o aparelho liga.

O aplicativo não pede acesso geral aos arquivos, instalação de outros pacotes, câmera, microfone ou localização.

## Ajustes recomendados no aparelho

- Ative **Inicialização automática** para Angel Mídia TV, se o fabricante oferecer essa opção.
- Em **Bateria**, selecione **Sem restrição** ou equivalente para o aplicativo.
- Configure o aparelho para religar após retorno da energia, quando o modelo oferecer **Power on after AC loss**.
- Deixe data e hora automáticas ativadas.
- Evite aplicativos de limpeza que apaguem os dados ou o cache do Angel Mídia TV.

Esses nomes variam entre fabricantes. O APK já possui o receptor Android padrão; os ajustes acima contornam bloqueios extras de alguns TV Boxes.

## Teste de aceitação

1. Abra o player online e espere uma mídia começar.
2. Desligue o Wi-Fi: a programação baixada deve continuar e o aviso offline deve aparecer.
3. Religue o Wi-Fi: a sincronização deve voltar sem intervenção.
4. Durante um vídeo, desligue e ligue o aparelho: o app deve abrir e retomar a mídia.
5. Atualize o APK por cima da versão instalada: o app deve abrir novamente preservando vínculo e programação.

## Limites esperados

- A continuidade offline depende de ao menos uma mídia completamente baixada.
- O Android pode bloquear a abertura automática se o usuário selecionar **Forçar parada**; abrir o app novamente remove esse bloqueio.
- Alguns fabricantes exigem liberar manualmente inicialização automática ou economia de bateria.
- Após **Limpar dados** ou desinstalar o APK, vínculo, programação salva e ponto de reprodução são removidos.
