import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

public class Main {

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));

        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);

        server.createContext("/", exchange -> {
            String hostname;
            try {
                hostname = InetAddress.getLocalHost().getHostName();
            } catch (Exception e) {
                hostname = "unknown";
            }

            String body = """
                    <!doctype html>
                    <html>
                      <head><title>Java Docker App</title></head>
                      <body style="font-family: system-ui, sans-serif; text-align: center; padding: 60px;">
                        <h1>Hello World from Java</h1>
                        <p>Served by com.sun.net.httpserver from inside a Docker container</p>
                        <p>Hostname (container id): %s</p>
                        <p>Java version: %s</p>
                      </body>
                    </html>
                    """.formatted(hostname, System.getProperty("java.version"));

            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });

        server.start();
        System.out.println("Java app listening on port " + port);
    }
}
