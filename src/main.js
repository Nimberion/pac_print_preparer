import { createApp } from "vue";
import App from "./app.vue";
// import "./assets/tailwind.css";
import "@unocss/reset/tailwind.css";
import "uno.css";
const app = createApp(App);

// import { unifiedApp } from "./plugins/unified/unified-app";
// app.use(unifiedApp);

app.mount("#app");
