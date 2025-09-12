var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let path = url.pathname;

    // 根路径默认访问 index.html
    if (path === "/" || path === "") {
      path = "/index.html";
    }

    // 去掉开头的 "/" 并加上 instruction/ 前缀
    const key = "instruction/" + (path.startsWith("/") ? path.slice(1) : path);

    try {
      const object = await env.MY_BUCKET.get(key);
      if (!object) {
        return new Response("404 Not Found", { status: 404 });
      }

      // 设置 Content-Type
      let contentType;
      if (key.endsWith(".html")) {
        contentType = "text/html;charset=UTF-8";
      } else if (key.endsWith(".md")) {
        contentType = "text/markdown;charset=UTF-8"; // 方法一：直接显示 Markdown
      } else {
        contentType = "application/octet-stream";
      }

      return new Response(object.body, {
        headers: { "content-type": contentType }
      });
    } catch (err) {
      return new Response("Error: " + err.message, { status: 500 });
    }
  }
};

export {
  worker_default as default
};
