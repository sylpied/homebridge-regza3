const PLUGIN_NAME = 'homebridge-regza3';
const PLATFORM_NAME = 'RegzaTVRemote';

const crypto = require("crypto");
const https = require("https");

const axios = require("axios");

let Characteristic, Service;

//module.exports = (api) => {
//  api.registerPlatform(PLATFORM_NAME, RegzaTVRemote);
//}
module.exports = (homebridge) => {
  Characteristic = homebridge.hap.Characteristic;
  Service = homebridge.hap.Service;
  homebridge.registerPlatform(PLATFORM_NAME, RegzaTVRemote);
}

class RegzaTVRemote {
  constructor(log, config, homebridge) {
    this.log = log;
    this.config = config;
    this.homebridge = homebridge;
    this.name = config.name;
    this.manufacturer = config.manufacturer;
    this.model = config.model;
    this.host = config.host;
    this.user = config.user;
    this.pass = config.pass;

    this.Characteristic = Characteristic;
    this.Service = Service;

    // get the name
    const tvName = this.name;

    // generate a UUID
    const uuid = this.homebridge.hap.uuid.generate(`homebridge:${PLUGIN_NAME}` + tvName);

    // create the accessory
    this.tvAccessory = new homebridge.platformAccessory(tvName, uuid);

    // set the accessory category
    this.tvAccessory.category = this.homebridge.hap.Categories.TELEVISION;

    /***********************************************************************************
    *********************************   TV Service   ***********************************
    /***********************************************************************************/

    const tvService = this.tvAccessory.addService(this.Service.Television);

    // set the tv name
    tvService.setCharacteristic(this.Characteristic.ConfiguredName, tvName);

    // set sleep discovery characteristic
    tvService.setCharacteristic(this.Characteristic.SleepDiscoveryMode, this.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    // handle on / off events using the Active characteristic
    tvService.getCharacteristic(this.Characteristic.Active)
      .on('get', this._getActive.bind(this))
      .on('set', this._setActive.bind(this));

    tvService.setCharacteristic(this.Characteristic.ActiveIdentifier, 1);

    // handle input source changes
    tvService.getCharacteristic(this.Characteristic.ActiveIdentifier)
      .onSet((newValue) => {
        const buttonName = this.config.sources[parseInt(newValue) - 1].button
        this._sendKey(buttonName);
        this.log.debug('> [Change Input Source]: ' + buttonName);
      });

    // handle remote control input
    tvService.getCharacteristic(this.Characteristic.RemoteKey)
      .onSet((newValue) => {
        const { allow_up, allow_down, allow_left, allow_right, select, back, information, play_pause } = this.config
        switch(newValue) {
          case this.Characteristic.RemoteKey.REWIND: {
            this._sendKey('40BE2C');
            this.log.debug('> [Remote Key Pressed]: REWIND');
            break;
          }
          case this.Characteristic.RemoteKey.FAST_FORWARD: {
            this._sendKey('40BE23');
            this.log.debug('> [Remote Key Pressed]: FAST_FORWARD');
            break;
          }
          case this.Characteristic.RemoteKey.NEXT_TRACK: {
            this._sendKey('40BE26');
            this.log.debug('> [Remote Key Pressed]: NEXT_TRACK');
            break;
          }
          case this.Characteristic.RemoteKey.PREVIOUS_TRACK: {
            this._sendKey('40BE27');
            this.log.debug('> [Remote Key Pressed]: PREVIOUS_TRACK');
            break;
          }
          case this.Characteristic.RemoteKey.ARROW_UP: {
            this._sendKey(this.config.allow_up);
            this.log.debug('> [Remote Key Pressed]: ARROW_UP ' + this.config.allow_up);
            break;
          }
          case this.Characteristic.RemoteKey.ARROW_DOWN: {
            this._sendKey(this.config.allow_down);
            this.log.debug('> [Remote Key Pressed]: ARROW_DOWN ' + this.config.allow_down);
            break;
          }
          case this.Characteristic.RemoteKey.ARROW_LEFT: {
            this._sendKey(this.config.allow_left);
            this.log.debug('> [Remote Key Pressed]: ARROW_LEFT ' + this.config.allow_left);
            break;
          }
          case this.Characteristic.RemoteKey.ARROW_RIGHT: {
            this._sendKey(this.config.allow_right);
            this.log.debug('> [Remote Key Pressed]: ARROW_RIGHT ' + this.config.allow_right);
            break;
          }
          case this.Characteristic.RemoteKey.SELECT: {
            this._sendKey(this.config.select);
            this.log.debug('> [Remote Key Pressed]: SELECT ' + this.config.select);
            break;
          }
          case this.Characteristic.RemoteKey.BACK: {
            this._sendKey(this.config.back);
            this.log.debug('> [Remote Key Pressed]: BACK ' + this.config.back);
            break;
          }
          case this.Characteristic.RemoteKey.EXIT: {
            this._sendKey('40BE93');
            this.log.debug('> [Remote Key Pressed]: EXIT');
            break;
          }
          case this.Characteristic.RemoteKey.PLAY_PAUSE: {
            this._sendKey(this.config.play_pause);
            this.log.debug('> [Remote Key Pressed]: PLAY_PAUSE ' + this.config.play_pause);
            break;
          }
          case this.Characteristic.RemoteKey.INFORMATION: {
            this._sendKey(this.config.information);
            this.log.debug('> [Remote Key Pressed]: INFORMATION ' + this.config.information)
            break;
          }
        }
      });

    /**
     * Create a speaker service to allow volume control
     */

    const speakerService = this.tvAccessory.addService(this.Service.TelevisionSpeaker);

    speakerService
      .setCharacteristic(this.Characteristic.Active, this.Characteristic.Active.ACTIVE)
      .setCharacteristic(this.Characteristic.VolumeControlType, this.Characteristic.VolumeControlType.ABSOLUTE);

    // handle volume control
    speakerService.getCharacteristic(this.Characteristic.VolumeSelector)
        .on('set', this._setVolume.bind(this));

    // create handlers for required characteristics
    speakerService.getCharacteristic(this.Characteristic.Mute)
        .onGet(this.handleMuteGet.bind(this))
        .onSet(this.handleMuteSet.bind(this));

    /**
     * Create TV Input Source Services
     * These are the inputs the user can select from.
     * When a user selected an input the corresponding Identifier Characteristic
     * is sent to the TV Service ActiveIdentifier Characteristic handler.
     */

    if (this.config.sources && this.config.sources.length > 0) {
      this.config.sources.map((src, index) => {
        const inputService = this.tvAccessory.addService(this.Service.InputSource, src.label, src.label);
        inputService
          .setCharacteristic(this.Characteristic.Identifier, index + 1)
          .setCharacteristic(this.Characteristic.ConfiguredName, src.label)
          .setCharacteristic(this.Characteristic.IsConfigured, this.Characteristic.IsConfigured.CONFIGURED)
          .setCharacteristic(this.Characteristic.InputSourceType, this.Characteristic.InputSourceType.HDMI);
        tvService.addLinkedService(inputService); // link to tv service
      })
    }


    /**
     * Publish as external accessory
     * Only one TV can exist per bridge, to bypass this limitation, you should
     * publish your TV as an external accessory.
     */
    this.homebridge.publishExternalAccessories(PLUGIN_NAME, [this.tvAccessory]);

    const informationService = new Service.AccessoryInformation();
  }

  getServices() {
    this.log.debug("Setting manufacturer to " + this.config.manufacturer);
    informationService
      .setCharacteristic(Characteristic.Manufacturer, this.config.manufacturer)
      .setCharacteristic(Characteristic.Model, this.config.model)
      .setCharacteristic(Characteristic.SerialNumber, 'XXX-XXXX-XXXXX');

    this.service.getCharacteristic(Characteristic.On)
      .on('get', this.getOnCharacteristicHandler.bind(this))
      .on('set', this.setOnCharacteristicHandler.bind(this));

    return [informationService, tvService, speakerService];
  }


  /**
   * Handle requests to get the current value of the "Mute" characteristic
   */
  handleMuteGet() {
    this.log.debug("Triggered GET Mute");

    // set this to a valid value for Mute
    const currentValue = 1;

    return currentValue;
  }

  /**
   * Handle requests to set the "Mute" characteristic
   */
  handleMuteSet(value) {
    this.log.debug("Triggered SET Mute:" + value);
  }

  async _getActive(callback) {
    callback(null, await this._getPowerStatus());
  }

  async _setActive(on, callback) {
    const desiredState = Boolean(on);
    this.log.debug("Setting switch to " + desiredState);
    const currentState = await this._getPowerStatus();
    if (desiredState === currentState) {
      this.log.debug("Already in the desired state, skipping");
      callback();
      return;
    }
    await this._sendKey('40BF12');
    callback();
  }

  async _getMute(callback) {
    this.log.debug("Disabling mute");
    callback(null, true);
  }

  async _setMute(on, callback) {
    this.log.debug("Enabling mute");
    const desiredState = Boolean(on);
    await this._sendKey('40BF10');
  }

  async _setVolume(down, callback) {
    this.log.debug(`Setting volume: ${down ? 'down' : 'up'}`);
    await this._sendKey(down ? '40BF1E' : '40BF1A');
    callback();
  }

  async _setRemoteKey(key, callback) {
    const map = {
      [Characteristic.RemoteKey.REWIND]: '40BE2C',
      [Characteristic.RemoteKey.FAST_FORWARD]: '40BE23',
      [Characteristic.RemoteKey.NEXT_TRACK]: '40BE26',
      [Characteristic.RemoteKey.PREVIOUS_TRACK]: '40BE27',
      [Characteristic.RemoteKey.ARROW_UP]: '40BF3E',
      [Characteristic.RemoteKey.ARROW_DOWN]: '40BF3F',
      [Characteristic.RemoteKey.ARROW_LEFT]: '40BF5F',
      [Characteristic.RemoteKey.ARROW_RIGHT]: '40BF5B',
      [Characteristic.RemoteKey.SELECT]: '40BF3D',
      [Characteristic.RemoteKey.BACK]: '40BF3B',
      [Characteristic.RemoteKey.EXIT]: '40BE93',
      [Characteristic.RemoteKey.PLAY_PAUSE]: '40BE2D',
      [Characteristic.RemoteKey.INFORMATION]: '40BF6E',
    }
    const keyCode = map[key];
    if (keyCode) {
      await this._sendKey(keyCode);
    } else {
      this.log.debug("Cannot send unsupported key: " + key);
    }
    callback();
  }

  // async _getFeature() {
  //   this.log.debug("Getting feature");
  //   const res = await axios({
  //     url: `http://${this.host}/public/feature`,
  //   });
  //   return res.data;
  // }

  async _getPowerStatus() {
    this.log.debug(`Getting power status`);
    const res = await this._sendRequest(`https://${this.host}:4430`, "/v2/remote/play/status");
    const contentType = res.data.content_type;
    if (!contentType) return false;
    return contentType !== "other";
  }

  async _getChannelName() {
    this.log.debug(`Getting power status`);
    const res = await this._sendRequest(`https://${this.host}:4430`, "/v2/remote/play/status");
    const channelName = res.data.epg_info_current.channel_name;
    if (!res.data.content_type) return false;
    this.log.debug("Getting channel name : " + channelName);
    return channelName;
  }

  async _getMuteStatus() {
    this.log.debug("Getting mute status");
    const res = await this._sendRequest(`https://${this.host}:4430`, "/v2/remote/status/mute");
    const { status, mute } = res.data;
    return status === 0 && mute === "on";
  }

  _md5sum(str) {
    return crypto.createHash('md5').update(str, 'binary').digest('hex');
  }

  async _sendKey(key) {
    return this._sendRequest(`http://${this.host}`, `/remote/remote.htm?key=${key}`);
  }

  // Send HTTP/HTTPS request using Digest authentication
  async _sendRequest(url, path) {
    const fullUrl = url + path;
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    const res = await axios({
      url: fullUrl,
      httpsAgent,
      validateStatus: (status) => status === 401,
    });
    const digestHeader = res.headers["www-authenticate"];
    const realm = digestHeader.match(/realm="([^"]+)"/)[1];
    const nonce = digestHeader.match(/nonce="([^"]+)"/)[1];
    const a1 = this._md5sum(`${this.user}:${realm}:${this.pass}`);
    const a2 = this._md5sum(`GET:${path}`);
    const nc = "00000001";
    const cnonce = "abc27321496dfe31"
    const response = this._md5sum(`${a1}:${nonce}:${nc}:${cnonce}:auth:${a2}`);
    return axios({
      url: fullUrl,
      httpsAgent,
      headers: {
        authorization: `Digest username="${this.user}", realm="${realm}", nonce="${nonce}", uri="${path}", qop=auth, nc=${nc}, cnonce="${cnonce}", response="${response}"`,
      },
    });
  }
}
