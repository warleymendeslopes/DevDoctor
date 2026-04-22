# Testes

Suite atual:
- usa `node --test`.
- cobre parser, privacidade, contexto, hints, assinatura, doctor e comando de teste.

Objetivo dos testes de contexto:
- garantir leitura do `package.json`;
- garantir composicao entre contexto manual e gerado;
- garantir truncamento por bloco e global;
- evitar regressao na ordem de prioridade das fontes.

Objetivo dos testes novos:
- validar deteccao de hints deterministas;
- validar normalizacao de assinatura para deduplicacao;
- validar checks basicos do `doctor`;
- manter flags como `--json` com contrato estavel.
