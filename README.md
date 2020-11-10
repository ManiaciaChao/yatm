<h1 align="center">Welcome to yatm 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/yatm" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/yatm.svg">
  </a>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> yet another teachermate helper

## Features

* Multi-mode sign-in support: normal, GPS and QR code
* System Nofication (test on macOS & gnome)
* Active Development
* <del>Docker support</del>

## Install

Simply download the latest release.

or you can build on your own.

```sh
yarn install
yarn build
```

## Usage

**Edit your `config.json` first:**

```json
{
  "interval": 3000, // 轮询间隔
  // 用于 GPS 签到（火星坐标）
  "lat": 30.511227, // 纬度
  "lon": 114.41021, // 经度
  // 用于二维码签到
  "shortUrl": true, // 生成更小的二维码，但会增加延时
  "name": "张三" // 微助教用户名，判断签到是否成功
}
```

Get your `openId` from WeChat official account `微助教服务号`. **Notice that `openId` will expire after thousands of requests or another entrace from WeChat.**

Run the script, then paste your `openId` into console:

```sh
yarn start
```

or with environments:

```sh
env OPEN_ID=${your openId} yarn start
```

For normal & GPS mode, the process is automatic. 

For QR code mode, you're expected to scan a generated QR code manually from your console. **The script WILL EXIT INSTANTLY when success, because a QR scan via WeChat causes the update of `openId`. You have to reacquire your new `openId` and run this scirpt again!**

## Author

👤 **maniacata**

* Website: http://blog.plus1sec.cn
* Github: [@ManiaciaChao](https://github.com/ManiaciaChao)

## Show your support

Give a ⭐️ if this project helped you!

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_