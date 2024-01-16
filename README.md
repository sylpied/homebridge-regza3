<div align="center">
  <h1>Homebridge REGZA TV Remote</h1>
</div>

<div align="center">
  <strong>This plugin add the REGZA TV to homebridge</strong>
</div>



## 📲 Installation
First, set up the TV side. Fix the IP address of the TV. There are two ways to do this: specify it directly, or make it a fixed assignment on the DHCP server side.
Set your username and password on REGZA App Connect.

Other settings such as wol settings and basic authentication are also required.
Please look it up on the internet.
<p align="center">
<img src="https://raw.githubusercontent.com/sylpied/homebridge-regza3/main/images/HomebridgeREGZAplugin01.png" height="100">
<img src="https://raw.githubusercontent.com/sylpied/homebridge-regza3/main/images/HomebridgeREGZAplugin02.png" height="100">
<img src="https://raw.githubusercontent.com/sylpied/homebridge-regza3/main/images/HomebridgeREGZAplugin03.png" height="100">
</p>
Set these values ​​on the Plugin settings screen.
Assign the HEX code to the Button name and Key map of Source according to the function.
There is a list of HEX codes in the images folder.
<p align="center">
<img src="https://raw.githubusercontent.com/sylpied/homebridge-regza3/main/images/regza_remote_table.png" width="600">
</p>
Go to the "Plugins" tab in [config-ui-x](https://github.com/oznu/homebridge-config-ui-x) and search for `hhomebridge-regza3`, or use the following command to install it.

```sh
npm i -g homebridge-regza3
```

## 🎫 Licence

The MIT License (MIT)
