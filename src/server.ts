import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`Listening on ${config.baseUrl} (port ${config.port})`);
});