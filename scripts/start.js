"use strict";

// 将环境变量 BABEL_ENV 和 NODE_ENV 设置为 development，确保 Babel 和 Webpack 以开发模式运行
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

// 处理未处理的 Promise 拒绝
process.on("unhandledRejection", (err) => {
  throw err;
});

// 加载环境配置
require("../config/env");

// 引入模块
const fs = require("fs"); // fs: 文件系统操作
const chalk = require("react-dev-utils/chalk"); // chalk: 用于终端字符串的样式和颜色处理
const webpack = require("webpack"); // Webpack 打包工具
const WebpackDevServer = require("webpack-dev-server"); // Webpack 开发服务器
const clearConsole = require("react-dev-utils/clearConsole"); // clearConsole: 清理控制台输出
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles"); // 检查必需文件是否存在
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require("react-dev-utils/WebpackDevServerUtils"); // Webpack 开发服务器的相关工具函数
const openBrowser = require("react-dev-utils/openBrowser"); // 自动在浏览器中打开开发服务器的工具
const semver = require("semver"); // 用于检查 React 版本
const paths = require("../config/paths"); // 项目路径配置
const configFactory = require("../config/webpack.config"); // Webpack 配置工厂函数
const createDevServerConfig = require("../config/webpackDevServer.config"); // 开发服务器配置工厂函数
const getClientEnvironment = require("../config/env"); // 获取客户端环境变量
const react = require(require.resolve("react", { paths: [paths.appPath] })); // 动态加载 React 依赖

// 获取客户端环境变量
const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
const useYarn = fs.existsSync(paths.yarnLockFile); // 判断项目是否使用 Yarn 作为包管理器
const isInteractive = process.stdout.isTTY; // 判断是否在交互式终端运行

// 检查必需文件是否存在（如 index.html 和 index.js）
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// 设置默认端口和主机
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// 检查浏览器兼容性
const { checkBrowers } = require("react-dev-utils/browsersHelper");
checkBrowers(paths.appPath, isInteractive)
  .then(() => {
    // 选择可用的端口
    return choosePort(HOST, DEFAULT_PORT);
  })
  .then((port) => {
    if (port == null) {
      return;
    }

    // 创建 Webpack 配置对象
    const config = configFactory("development");
    const protocol = process.env.HTTPS === "true" ? "https" : "http";
    const appName = require(paths.appPackageJson).name; // 获取项目名称

    const useTypeScript = fs.existsSync(paths.appTsConfig); // 判断项目是否使用 TypeScript
    const urls = prepareUrls(
      protocol,
      HOST,
      port,
      paths.publicUrlOrPath.slice(0, -1)
    );

    // 创建 Webpack 编译器
    const compiler = createCompiler({
      appName,
      config,
      urls,
      useYarn,
      useTypeScript,
      webpack,
    });

    // 准备代理配置
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(
      proxySetting,
      paths.appPublic,
      paths.publicUrlOrPath
    );

    // 创建开发服务器配置
    const serverConfig = {
      ...createDevServerConfig(proxyConfig, urls.lanUrlForConfig),
      host: HOST,
      port,
    };

    // 启动 Webpack 开发服务器
    const devServer = new WebpackDevServer(serverConfig, compiler);

    // 在服务器启动后执行回调函数
    devServer.startCallback(() => {
      if (isInteractive) {
        clearConsole();
      }

      if (env.raw.FAST_REFRESH && semver.lt(react.version, "16.10.0")) {
        // 检查 React 版本，确定是否支持快速刷新（Fast Refresh）
      }

      // 在浏览器中打开开发服务器地址
      openBrowser(urls.localUrlForBrowser);
    });

    // 处理终止信号（如 Ctrl+C），关闭开发服务器
    ["SIGINT", "SIGTERM"].forEach(function (sig) {
      process.on(sig, function () {
        devServer.close();
        process.exit();
      });
    });

    // 在非 CI 环境下，监听标准输入的结束事件，关闭开发服务器
    if (process.env.CI !== "true") {
      process.stdin.on("end", function () {
        devServer.close();
        process.exit();
      });
    }
  })
  .catch((err) => {
    // 如果捕获到错误，输出错误信息并退出
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
