import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import "/src/index.css";
import VueSweetalert2 from "vue-sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";



import swal from "sweetalert2";
window.Swal = swal;

const app = createApp(App);

app.use(VueSweetalert2);

createApp(App).mount("#app");
window.Swal = app.config.globalProperties.$swal;
