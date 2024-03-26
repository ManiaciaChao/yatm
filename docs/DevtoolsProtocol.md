# Devtools Protocol

> **WARNING:** Making devtools enable could be dangerous. Anyone knows debugging port could read your cookies & modify your webpages. Do it at your own risk!

## Enable Remote Debugging

### Windows

Launch WeChat with command line argument `-remote-debugging-port=<PORT>` (using port 8000 for example).

**No longer working for WeChat 3.2.1 and above.** Go find an out-dated version plz :)

### Wine

Basically the same as Windows, but you have to find out the right file to edit.

On archlinux, it's function `CallWeChat()` in `~/.deepinwine/deepin-wine-helper/run_v3.sh`:

```shell
CallWeChat()
{
    # ...
    CallProcess "$@" "-remote-debugging-port=<PORT>"
}
```

### iOS/iPadOS/macOS

I don't know how to make this work on Apple things.

https://github.com/RemoteDebug/remotedebug-ios-webkit-adapter

### Android

USB/Wireless debugging is required to be enabled.

In WeChat browser:

1. Open <http://debugxweb.qq.com/?inspector=true> and don't close it

Check your `adb` connections:

```shell
$ adb devices
List of devices attached
<DEVICE_NAME>   device
```

Forward to localhost:

```shell
unix_sockets=$(adb shell "cat /proc/net/unix")
devtools_port=$(echo "$unix_sockets" | grep -o 'webview_devtools_remote_[0-9]*' | grep -o '[0-9]*')
adb -s <DEVICE_NAME> forward tcp:<PORT> localabstract:webview_devtools_remote_$devtools_port
```

## Configuration

Open `http://localhost:<PORT>/json` to see if remote debugging works.

Add field `devtools` into your `config.json`

```javascript
{
  // ...
  "devtools": {},
  // ...
}
```

or with your custom host & port:

```javascript
{
  // ...
  "devtools":{ //
    "host": "127.0.0.1", // Optional, 127.0.0.1 by default
    "port": <PORT>, // Optional, 8000 by default
    "local": true, // Optional, true by default
  },
  // ...
}
```

## Usage

Open any webpage in your WeChat, then you can have it running in background.

Run the script:

```shell
yarn start
```
