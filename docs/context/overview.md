# Contexto do projeto

DevDoctor CLI executa comandos do terminal e, quando ocorre erro, gera explicacao estruturada com IA.

Objetivo principal:
- reduzir o atrito de depuracao no terminal;
- manter o erro original visivel;
- anexar apenas contexto essencial do projeto para melhorar a resposta.

Escopo do produto:
- roda comando do usuario;
- detecta e extrai trecho de erro;
- sanitiza dados sensiveis de forma heuristica;
- aplica hints deterministas para stacks conhecidas quando possivel;
- deduplica erros recorrentes por assinatura local;
- envia para provedor configurado (OpenAI, Gemini ou Ollama);
- exibe explicacao, causas e possivel solucao;
- mantem historico local e oferece diagnostico com `devdoctor doctor`.

Fora de escopo:
- editar codigo automaticamente;
- varrer repositorio inteiro como IDE agent.
