# Devtools Protocol

> **WARNING:** Making devtools enable could be dangerous. Anyone knows debugging port could read your cookies & modify your webpages. Do it at your own risk!

## Enable Remote Debugging

### Windows

Launch WeChat with command line argument `-remote-debugging-port=<PORT>` (using port 8000 for example).

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

1. Open [debugmm.qq.com/?forcex5=true](debugmm.qq.com/?forcex5=true) to enable x5 core.
2. Open [http://debugtbs.qq.com/](http://debugtbs.qq.com/) to install x5 core.
3. Open [http://debugx5.qq.com/](http://debugx5.qq.com/). In `信息` tab, check option `打开TBS内核Inspector调试功能`.
4. Restart WeChat.

Check your `adb` connections:

```shell
$ adb devices
List of devices attached
<DEVICE_NAME>   device
```

Forward to localhost:

```shell
# stop WeChat instance first
$ adb shell am force-stop com.tencent.mm
# after manually start WeChat:
$ adb shell ps | grep com.tencent.mm:toolsmp | awk '{print $2}' | xargs -I @ adb -s <DEVICE_NAME> forward tcp:<PORT> localabstract:webview_devtools_remote_@
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
