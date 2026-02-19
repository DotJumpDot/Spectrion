const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    background: "./src/core/background/background.ts",
    popup: "./src/core/popup/popup.ts",
    content: "./src/core/content/content.ts",
    analysis: "./src/core/analysis/analysis.ts",
    analytics: "./src/core/analytics/analytics.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "src/core/popup/popup.html", to: "popup.html" },
        { from: "src/core/popup/popup.css", to: "popup.css" },
        { from: "src/core/analysis/analysis.html", to: "analysis.html" },
        { from: "src/core/analysis/analysis.css", to: "analysis.css" },
        { from: "src/core/analytics/analytics.html", to: "analytics.html" },
        { from: "src/core/analytics/analytics.css", to: "analytics.css" },
        { from: "icons", to: "icons", noErrorOnMissing: true },
        { from: "src/core/content/injected.js", to: "injected.js" },
      ],
    }),
  ],
  optimization: {
    minimize: false,
  },
};
