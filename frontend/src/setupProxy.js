const { createProxyMiddleware } = require("http-proxy-middleware");

/** Dev-only: same-origin /api/* → FastAPI so /api/uploads and proxied API paths work on :3000 */
module.exports = function setupProxy(app) {
  const target = process.env.REACT_APP_DEV_PROXY_TARGET || "http://127.0.0.1:8000";
  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
};
