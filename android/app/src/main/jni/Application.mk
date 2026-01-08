APP_ABI := all
APP_STL := c++_static
APP_CFLAGS += -O3
APP_CPPFLAGS += -O3 -std=c++17
APP_LDFLAGS += -Wl,-z,max-page-size=16384
