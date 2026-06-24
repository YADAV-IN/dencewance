cmake_minimum_required(VERSION 3.10)
project(DencewanceGateway)

set(CMAKE_CXX_STANDARD 17)

# This is where we will eventually link cpp-httplib or Drogon
add_executable(gateway main.cpp)
