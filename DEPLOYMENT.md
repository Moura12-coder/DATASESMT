# Implantação e validação

Esta branch corrige autenticação, aprovação, controle de acesso, persistência de documentos SST, indicadores e inconsistências de compilação. Ela não certifica o sistema inteiro como pronto para produção.

## Requisitos e instalação

- Node.js 22 ou 24 e pnpm 10.4.1 (use Corepack ou `npx pnpm@10.4.1`).
- MySQL 8 em uma base dedicada, com backup antes de qualquer migração.
- HTTPS na implantação pública.

```sh
cp .env.example .env
# Configure DATABASE_URL, VITE_APP_ID, APP_URL e um JWT_SECRET aleatório.
npx pnpm@10.4.1 install --frozen-lockfile
npx pnpm@10.4.1 db:migrate
npx pnpm@10.4.1 dev
```

`db:push` agora apenas aplica migrações existentes; não gera alterações implicitamente. Para desenvolver mudanças de schema, use `db:generate`, revise o SQL e depois `db:migrate`.

A migração 0013 preserva a aprovação das contas legadas e cria cadastros novos como pendentes pela aplicação. Ela acrescenta campos à tabela `ghe` e uma restrição de email único. Antes de migrar, consulte duplicatas:

```sql
SELECT LOWER(TRIM(email)) AS normalized_email, COUNT(*) AS total
FROM users WHERE email IS NOT NULL
GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1;
```

Resolva duplicatas com o responsável pelos dados e normalize os emails existentes antes da migração. A restrição falha em vez de apagar ou fundir contas automaticamente. Contas antigas com senha em texto puro devem redefinir a senha; não se aceita autenticação por texto puro. Hashes PBKDF2 legados válidos são convertidos para scrypt no próximo login bem-sucedido.

## Primeiro administrador

Não há senha fixa nem endpoint público de promoção de usuários. Crie a primeira conta no servidor, com a senha pela entrada padrão:

```sh
# Arquivo temporário privado contendo uma senha de 12–128 caracteres em uma linha.
npx pnpm@10.4.1 admin:create administrador@example.com < /caminho/privado/senha.txt
# Remova o arquivo de senha após criar a conta.
```

Depois entre em `/login` e use `/app/access` para aprovar cadastros e alterar perfis. Aprovação e perfil são decisões separadas. O administrador pode consultar todas as unidades da implantação. Usuários comuns não podem ler ou alterar dados operacionais de SST; a interface informa essa restrição. Não existe isolamento completo entre organizações: use uma implantação por organização até implementar e testar esse isolamento em todas as tabelas e rotas.

A aprovação é acompanhada pela tela de gestão; a aplicação não promete envio de email de aprovação. Alterações de senha, aprovação e perfil invalidam sessões anteriores por versão de sessão.

## Serviços externos

- Recuperação de senha: configure `RESEND_API_KEY`, `MAIL_FROM` com remetente verificado e `APP_URL`. O link expira em uma hora e seu token só é entregue pelo email. Sem configuração, a operação informa indisponibilidade; nunca retorna o token pela API. Em falha de entrega, o token é removido e um sinal operacional é registrado, sem revelar se uma conta existe.
- OAuth Manus é opcional. Configure `OAUTH_SERVER_URL` e `VITE_OAUTH_PORTAL_URL` somente se utilizar esse provedor. O login por email funciona independentemente dele.
- IA e armazenamento de documentos ainda dependem dos serviços Forge configurados nas variáveis de exemplo.
- eSocial: o repositório não contém um transmissor oficial homologado. O envio de riscos e afastamentos retorna indisponibilidade, sem criar recibo fictício nem marcar transmissão como concluída. A integração exige geração por trabalhador, leiaute validado, assinatura e certificado, homologação e confirmação externa. O XML agregado do mapa é uma exportação interna, não um evento oficial.

## Segurança operacional

O processo falha no início sem DATABASE_URL, VITE_APP_ID e JWT_SECRET de pelo menos 32 caracteres. Gere um segredo aleatório e não use o valor de exemplo. Configure `TRUST_PROXY_HOPS` apenas com a quantidade exata de proxies confiáveis. O limite de tentativas de autenticação é local ao processo; em múltiplas instâncias, aplique também limitação compartilhada no gateway. O endpoint `/healthz` confirma que o processo atende HTTP; não é uma verificação de prontidão do banco.

Downloads pelo proxy de armazenamento exigem sessão administrativa. Restrinja também o acesso diretamente no provedor de objetos: URLs já públicas ou assinadas anteriormente não são revogadas por esta mudança. Faça rotação do JWT_SECRET ao implantar se for necessário invalidar sessões legadas imediatamente.

## Verificações

```sh
npx pnpm@10.4.1 check
npx pnpm@10.4.1 test
npx pnpm@10.4.1 build
```

Quatro suítes legadas que usam banco ficam explicitamente ignoradas sem `TEST_DATABASE_URL` (52 testes). Para executá-las, provisione um MySQL descartável, aplique as migrações nessa base e execute:

```sh
TEST_DATABASE_URL=mysql://test:password@localhost:3306/datasesmt_test npx pnpm@10.4.1 test
```

Os testes nunca reutilizam DATABASE_URL de produção: o setup substitui a conexão por TEST_DATABASE_URL ou a remove. Alguns testes legados usam capturas de erro permissivas e não comprovam integração real; os novos testes de regressão verificam bloqueios, contratos de cadastro, hashing e recuperação com mocks explícitos.

## Verificação desta entrega

O build de produção, a checagem de tipos e os testes sem banco foram executados localmente. `drizzle-kit check` validou a consistência dos metadados, mas não executou o SQL em MySQL. O navegador de teste não estava instalado e o download do Chromium falhou; portanto não houve validação visual automatizada nesta sessão.

## Limites ainda existentes

- Os módulos `phase1Complete`, `remainingFeatures` e partes de `phase1Features` ainda contêm demonstrações, objetos em memória e retornos simulados. As páginas Moura e alguns painéis alternativos também têm dados demonstrativos. Não use esses resultados como evidência técnica ou operacional.
- A migração, o envio de email, o armazenamento e os fluxos completos com banco real precisam ser verificados em homologação. Os testes desta entrega não substituem essa etapa.
- A geração de documentos precisa de revisão de um profissional responsável antes de assinatura ou uso. Nenhum indicador é apresentado como certificação automática de conformidade.
- As mudanças não implementam segregação completa por organização, matriz de permissões por unidade, auditoria integral nem transmissão oficial ao eSocial.

O painel Analytics agora usa consultas reais, não inventa benchmark e exporta CSV efetivo. O gráfico de incidentes do painel principal usa registros reais; o indicador de exames mede cobertura básica registrada, não conformidade legal.
