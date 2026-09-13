import { init, recordMetric } from "kmind-apm-web";
init({ serviceName: "vanilla-example", clientKey: "SUBSTITUA_PELA_CLIENT_KEY", endpoint: "https://ingest.kmind.com.br/v1", propagateTraceTo: [location.hostname] });
recordMetric("example.loaded", 1);
document.querySelector<HTMLButtonElement>("#request")?.addEventListener("click", () => void fetch("/api/health"));
document.querySelector<HTMLButtonElement>("#error")?.addEventListener("click", () => { throw new Error("Erro manual do exemplo Kmind APM Web"); });
