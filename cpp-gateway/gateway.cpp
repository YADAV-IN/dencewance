#include "httplib.h"
#include <iostream>
#include <string>

using namespace httplib;

int main() {
    // This is the C++ API Gateway
    // It listens on port 8080 and proxies all requests to Appwrite
    
    Server svr;
    const std::string APPWRITE_URL = "nyc.cloud.appwrite.io";
    
    std::cout << "Starting C++ Reverse Proxy Gateway on port 8080..." << std::endl;
    std::cout << "Routing all traffic to: " << APPWRITE_URL << std::endl;

    // A fast custom route written entirely in C++
    svr.Get("/api/fast-ping", [](const Request& req, Response& res) {
        res.set_content("{\"status\": \"C++ Gateway is running lightning fast!\"}", "application/json");
    });

    // Proxy everything else to Appwrite
    svr.set_error_handler([APPWRITE_URL](const Request& req, Response& res) {
        // We create a client to talk to the real Appwrite server
        Client cli("https://" + APPWRITE_URL);
        
        // Forward headers
        Headers headers;
        for (auto it = req.headers.begin(); it != req.headers.end(); ++it) {
            if (it->first != "Host") {
                headers.insert(*it);
            }
        }
        headers.insert({"Host", APPWRITE_URL});

        // Make the proxied request
        auto appwrite_res = cli.Get(req.path.c_str(), headers);
        
        if (appwrite_res) {
            res.status = appwrite_res->status;
            res.set_content(appwrite_res->body, appwrite_res->get_header_value("Content-Type").c_str());
            
            // Forward response headers (like CORS)
            for (auto it = appwrite_res->headers.begin(); it != appwrite_res->headers.end(); ++it) {
                res.set_header(it->first.c_str(), it->second.c_str());
            }
        } else {
            res.status = 502;
            res.set_content("{\"error\": \"Bad Gateway - Appwrite unreachable from C++\"}", "application/json");
        }
    });

    // Handle CORS preflight
    svr.Options(".*", [](const Request& req, Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        res.set_header("Access-Control-Allow-Headers", "X-Appwrite-Project, Content-Type, Authorization, X-Appwrite-Response-Format");
        res.status = 200;
    });

    svr.listen("0.0.0.0", 8080);
    return 0;
}
