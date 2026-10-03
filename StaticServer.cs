using System;
using System.IO;
using System.Net;
using System.Threading;
using System.Collections.Generic;

public class StaticServer {
    private HttpListener _listener;
    private string _baseDir;
    private static readonly Dictionary<string, string> MimeTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
        { ".html", "text/html; charset=utf-8" },
        { ".css", "text/css; charset=utf-8" },
        { ".js", "application/javascript; charset=utf-8" },
        { ".json", "application/json; charset=utf-8" },
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".png", "image/png" },
        { ".gif", "image/gif" },
        { ".svg", "image/svg+xml" },
        { ".webp", "image/webp" },
        { ".ico", "image/x-icon" },
        { ".woff", "font/woff" },
        { ".woff2", "font/woff2" },
        { ".ttf", "font/ttf" },
        { ".mp3", "audio/mpeg" },
        { ".mp4", "video/mp4" }
    };

    public StaticServer(string baseDir, int port) {
        _baseDir = Path.GetFullPath(baseDir);
        _listener = new HttpListener();
        _listener.Prefixes.Add("http://localhost:" + port + "/");
    }

    public void Start() {
        _listener.Start();
        ThreadPool.QueueUserWorkItem(ListenLoop);
    }

    private void ListenLoop(object state) {
        while (_listener.IsListening) {
            try {
                HttpListenerContext ctx = _listener.GetContext();
                ThreadPool.QueueUserWorkItem(ProcessRequest, ctx);
            } catch {
                if (!_listener.IsListening) break;
            }
        }
    }

    public void Stop() {
        if (_listener != null && _listener.IsListening) {
            _listener.Stop();
        }
    }

    private void ProcessRequest(object state) {
        HttpListenerContext ctx = (HttpListenerContext)state;
        try {
            HttpListenerRequest req = ctx.Request;
            HttpListenerResponse res = ctx.Response;

            res.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            res.Headers["Pragma"] = "no-cache";
            res.Headers["Expires"] = "0";

            if (req.HttpMethod == "OPTIONS") {
                res.StatusCode = 200;
                res.Close();
                return;
            }

            string rawPath = Uri.UnescapeDataString(req.Url.AbsolutePath);
            if (rawPath == "/" || string.IsNullOrEmpty(rawPath)) {
                rawPath = "/index.html";
            }

            string relPath = rawPath.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar);
            string fullPath = Path.GetFullPath(Path.Combine(_baseDir, relPath));

            if (!fullPath.StartsWith(_baseDir, StringComparison.OrdinalIgnoreCase) || !File.Exists(fullPath)) {
                res.StatusCode = 404;
                byte[] notFound = System.Text.Encoding.UTF8.GetBytes("404 Not Found: " + rawPath);
                res.ContentType = "text/plain";
                res.ContentLength64 = notFound.Length;
                res.OutputStream.Write(notFound, 0, notFound.Length);
                res.Close();
                return;
            }

            string ext = Path.GetExtension(fullPath);
            string contentType;
            if (!MimeTypes.TryGetValue(ext, out contentType)) {
                contentType = "application/octet-stream";
            }
            res.ContentType = contentType;

            byte[] bytes = File.ReadAllBytes(fullPath);
            res.ContentLength64 = bytes.Length;
            res.StatusCode = 200;
            if (req.HttpMethod != "HEAD") {
                res.OutputStream.Write(bytes, 0, bytes.Length);
            }
            res.Close();
        } catch {
            try {
                ctx.Response.StatusCode = 500;
                ctx.Response.Close();
            } catch {}
        }
    }
}
