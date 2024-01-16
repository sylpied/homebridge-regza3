<div align="center">
  <h1>Homebridge REGZA TV Remote</h1>
</div>

<div align="center">
  <strong>REGZA TV のリモコン操作をhomebridgeに追加します</strong>
</div>

## 📲 インストール
まず、TV側のセットアップをします。TVのIP Addressを固定化します。方法は直接指定するか、DHCPサーバー側で固定割り当てにするかなどがあります。
REGZA App Conectでユーザー名とパスワードを設定します。
<p align="center">
<img src="https://raw.githubusercontent.com/sylpied/homebridge-regza3/main/images/HomebridgeREGZAplugin01.png" height="100">
<img src="https://raw.githubusercontent.com/sylpied/homebridge-regza3/main/images/HomebridgeREGZAplugin02.png" height="100">
<img src="https://raw.githubusercontent.com/sylpied/homebridge-regza3/main/images/HomebridgeREGZAplugin03.png" height="100">
</p>
これらで設定した値をPluginの設定画面で設定します。
SourceのButton nameとKey mapは、HEXのコードを機能に応じて割り当てます。
HEXのコードは、images folderの中に一覧表があります。
<p align="center">
<img src="https://raw.githubusercontent.com/sylpied/homebridge-regza3/main/images/regza_remote_table.png" width="600">
</p>
[config-ui-x](https://github.com/oznu/homebridge-config-ui-x)の「プラグイン」タブから`homebridge-regza3`で検索、もしくは下記のコマンドでインストールしてください。


```sh
npm i -g homebridge-regza3
```

## 🎫 Licence

The MIT License (MIT)
