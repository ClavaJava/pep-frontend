import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/pacientes": "http://localhost:8080",
      "/internacoes": "http://localhost:8080",
      "/leitos": "http://localhost:8080",
      "/prescricoes": "http://localhost:8080",
      "/relatorios": "http://localhost:8080",
    },
  },
});
