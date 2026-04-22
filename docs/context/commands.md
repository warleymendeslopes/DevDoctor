# Comandos e comportamento

Comandos suportados:
- `devdoctor setup`: configura provedor/modelo.
- `devdoctor <cmd>`: executa comando e tenta explicar falha.
- `devdoctor explain [last|id]`: explica uma falha salva do historico.
- `devdoctor history`: lista falhas recentes.
- `devdoctor repeat <id>`: reroda um comando salvo no historico.
- `devdoctor test`: valida conectividade e resposta minima da IA.
- `devdoctor doctor`: diagnostico local do ambiente e provider.
- `devdoctor context`: regenera contexto automatico para enriquecer prompts.

Flags globais:
- `--preview`: mostra payload sanitizado, sem chamar IA.
- `--no-ai`: nao chama IA; ainda salva falha.
- `--yes`/`-y`: confirma envio quando `DEVDOCTOR_CONFIRM_SEND=1`.
- `--json`: emite payload estruturado para CI/integracoes.
