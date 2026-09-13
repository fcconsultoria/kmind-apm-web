# Kmind APM Web

SDK de observabilidade para browser, agnostico de framework. Esta primeira entrega inclui Web Vitals, captura global de erros, heartbeat de conta, spans de `fetch`/XHR e propagacao W3C `traceparent`.

```ts
import { init } from "kmind-apm-web";

init({
  serviceName: "portal-cliente",
  clientKey: "kmw_...",
  propagateTraceTo: ["api.minhaempresa.com.br"],
});
```

## Logs correlacionados

Use a API pública abaixo para logs estruturados; quando houver um span ativo,
`trace_id` e `span_id` são adicionados ao registro. A captura de
`console.warn` e `console.error` é opcional, pois altera métodos globais:

```ts
import { logger } from "kmind-apm-web";
logger.info("Checkout iniciado", { cartId: "c_123" });
logger.warn("Estoque baixo", { sku: "sku-42" });
logger.error("Pagamento recusado", { provider: "cartao" });
```

```ts
init({
  serviceName: "portal-cliente",
  clientKey: "kmw_...",
  captureConsole: true,
});
```

Cadastre o servico como **Frontend / APM Web** no Console para gerar a `clientKey` e registrar as origens permitidas. A chave e publica e restrita por origem, tenant e limite de requisicoes no gateway.

## Wrappers

- `kmind-apm-web-react`: `initKmindReact`, `useKmindRoute` e `KmindErrorBoundary`; resolve `VITE_KMIND_*`.
- `kmind-apm-web-vue`: `initKmindVue` e `installKmindVue(app, router)`; resolve `VITE_KMIND_*`.
- `kmind-apm-web-next`: `initKmindNext`, `KmindNextNavigation` e `KmindNextErrorBoundary`; resolve `NEXT_PUBLIC_KMIND_*`.

Os wrappers leem ambiente publico; o pacote core nunca acessa `process.env`.

## Privacidade e amostragem

Por padrao, `token`, `email`, `cpf` e `password` em URLs sao mascarados. A configuracao permite ampliar regras por atributo ou query string e ajustar o scrub final:

```ts
init({
  serviceName: "portal-cliente",
  clientKey: "kmw_...",
  sampleRate: 0.2,
  slowTraceThresholdMs: 1200,
  privacy: { redactAttributeKeys: ["user.id", "authorization"], redactUrlQueryKeys: ["session", "token"] },
  scrub: (value, key) => key === "order.id" ? "[redacted]" : value,
});
```

Mesmo fora da amostra inicial, traces com erro ou acima de `slowTraceThresholdMs` sao promovidos para envio.

## Isolamento de desempenho

A SDK executa telemetria em modo *best effort*: nenhuma falha de coleta é
propagada para a aplicação. Os eventos são enviados em lote, com no máximo 20
eventos por requisição, fila limitada a 100 eventos por sinal e timeout de 3
segundos no fallback por `fetch`. Em cenários de pressão, eventos são
descartados para preservar memória, conexões e a operação nativa do site.
As chamadas do próprio agente usam a referência nativa de `fetch`, portanto não
geram spans, logs ou loops de instrumentação.

## Teste manual da correlacao

1. Cadastre `http://localhost:5173` como origem permitida e use a chave no exemplo vanilla.
2. Configure `propagateTraceTo` com o host da API Node instrumentada.
3. Clique em **Fazer requisicao** e confirme no Tempo que o span `HTTP GET` e o span do backend usam o mesmo `trace_id`.
