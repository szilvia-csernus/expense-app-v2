import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // S3 Storage (logo)
            urlPattern: ({ url }) => {
              const isAmazonS3 =
                url.hostname.includes(".amazonaws.com") &&
                url.hostname.includes("s3.");
              return isAmazonS3;
            },
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "aws-logo-cache",
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // AppSync GraphQL API
            urlPattern: ({ url }) => {
              const isAppSyncAPI =
                url.hostname.includes(".amazonaws.com") &&
                url.pathname.includes("/graphql");
              return isAppSyncAPI;
            },
            handler: "NetworkFirst",
            options: {
              cacheName: "graphql-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cognito authentication
            urlPattern: ({ url }) => {
              return url.hostname.includes("cognito-identity");
            },
            handler: "NetworkOnly", // Auth requests should not be cached
          },
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.endsWith("/submit-expense"),
            handler: "NetworkOnly",
            method: "POST",
            options: {
              backgroundSync: {
                name: "sendExpenseFormQueue",
                options: {
                  maxRetentionTime: 60 * 24 * 2, // 2 days
                },
              },
            },
          },
        ],
      },
      manifest: {
        id: "expense-app",
        short_name: "Expense App",
        name: "Expense App for Redeemer Rotterdam Church",
        description:
          "Expense Reimbursement App for International Redeemer Church of Rotterdam",
        lang: "en-US",
        theme_color: "#000000",
        icons: [
          {
            src: "icon-36x36.png",
            type: "image/png",
            sizes: "36x36",
            purpose: "any",
          },
          {
            src: "icon-48x48.png",
            type: "image/png",
            sizes: "48x48",
            purpose: "any",
          },
          {
            src: "icon-96x96.png",
            type: "image/png",
            sizes: "96x96",
            purpose: "any",
          },
          {
            src: "icon-144x144.png",
            type: "image/png",
            sizes: "144x144",
            purpose: "any",
          },
          {
            src: "icon-192x192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "any",
          },
          {
            src: "icon-512x512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any",
          },
          {
            src: "icon-square-180x180.png",
            type: "image/png",
            sizes: "180x180",
            purpose: "maskable",
          },
          {
            src: "icon-square-180x180.png",
            type: "image/png",
            sizes: "180x180",
            purpose: "any",
          },
        ],
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#232426",
        launch_handler: {
          client_mode: ["navigate-existing", "auto"],
        },
      },
    }),
  ],
  build: {
    target: "es2020",
    cssTarget: "chrome90",
    cssCodeSplit: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-amplify-core": ["aws-amplify"],
          "vendor-amplify-ui": ["@aws-amplify/ui-react"],
          "vendor-amplify-storage": ["@aws-amplify/ui-react-storage"],
          "vendor-redux": ["react-redux", "@reduxjs/toolkit"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "aws-amplify"],
  },
});
