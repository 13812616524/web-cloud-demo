const express = require("express"),
  bodyParser = require("body-parser"),
  app = express(),
  chokidar = require("chokidar"),
  urlencodedParser = bodyParser.urlencoded({ extended: false });

//支持Request Payload方式的来自前端请求的参数（利用req.body获取[post方式]；req.query获取[get方式]）
app.use(bodyParser.json({ limit: "1mb" }));

const handleMock = (path) => {
  const fPath = String.raw`${path}`.split("\\").join("/");
  const _require = require("./" + fPath);
  _require.cgi &&
    _require.cgi(
      app,
      fPath.replace(/^cgi/, "").replace(/.js$/, ""),
      urlencodedParser
    );
};

//监控本地mock的restful api请求
const watcher = chokidar.watch("./cgi", { persistent: true });
watcher.on("add", (path) => {
  handleMock(path);
});

var server = app.listen(9575, "0.0.0.0", function () {
  var host = server.address().address,
    port = server.address().port;
  console.log("本地模拟CGI服务已启动，地址为http://%s:%s", host, port);
});
