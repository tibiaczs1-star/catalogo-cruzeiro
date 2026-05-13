# Handoff

Updated: 2026-05-13T22:25:00.000Z

Ajuste final aprovado para commit: entrada da home separada da galeria de manchetes. Cards com foto ficam abaixo da hero, nao dentro dela, e mantem largura minima real. Bolinhas manuais trocam a manchete. O CTA principal abre a materia selecionada. Removida promessa de Resumo do dia em video; TV e apenas local/regional e fica oculta sem video incorporavel do Jurua/Cruzeiro do Sul.

Nova correcao aplicada: loader real em tres atos, sem home aparecendo por tras. Estado inicial usa `catalogo-site-booting`; `.page-shell`, header e nav ficam invisiveis ate a splash terminar e `site-loaded` ser aplicado. Splash `catalogo-cinematic-live` mostra logo, frases editoriais, baloes de noticias e brilho que acompanha o mouse. Depois da apresentacao entra loader final que aguarda prontidao da primeira dobra com timeout seguro. Cards de utilidade foram transformados em acoes diretas: fontes usadas, pedir correcao, telefones urgentes, saude, chuva/rio, farmacia e WhatsApp para foto/video/pauta.

Validado localmente por Playwright: no inicio `.page-shell` hidden/opacity 0, splash display grid, 12 baloes; no final `.page-shell` visible/opacity 1 e splash display none. Guard PubPaid OK e review team totalIssues=0.

## Next

- Enviar print para o usuario se quiser revisar; depois commit seletivo e push.
