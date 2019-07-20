const browser = require('webextension-polyfill');

import externalLinks from "../shared/externalLinks";

const DEFAULT_SETTINGS = {
    // order is important
    externalLinks: ["google_images", "giphy_images", "youglish", "thesaurus_com", "urban_dictionary", "google_define"],
    showTranslations: true,
    showMobileAdd: true
};

export default class Db {
    constructor () {
      //this.loadAll();
    }

    get (key, defaultValue) {
      const hasDefaultValue = typeof defaultValue !== 'undefined';
      return browser.storage.sync.get(hasDefaultValue ? { [key]: defaultValue } : key)
        .then((result) => {
          if (process.env.DEBUG) {
            console.info(`Retrieved value ${key}: `, result[key]);
          }
          return result[key];
        });
    }
  
    /**
     * Retrieves multiple settings in one storage call
     * @param {Object} settings Map of setting keys and default values
     * @return {Object} Map of retrieved setting values
     */
    getMultiple (settings) {
      return browser.storage.sync.get(settings)
        .then((result) => {
          if (process.env.DEBUG) {
            console.info(`Retrieved values ${Object.keys(settings).join(', ')}: `, Object.values(result).map(JSON.strinfiy).join(', '));
          }
          return Object.keys(result).reduce((results, key) => {
            return Object.assign(results, {
              [key]: result[key]
            });
          }, {});
        });
    }
  
    set (setting, value) {
      return browser.storage.sync
        .set({ [setting]: value })
        .catch((e) => {
          console.error(`Error attempting to save ${setting};`, e);
        })
        .finally(() => {
          if (process.env.DEBUG) {
            console.info(`Saved setting ${setting} :`, value);
          }
        });
    }
  
    setMultiple (settings) {
      return browser.storage.sync
        .set(settings)
        .catch((e) => {
          console.error(`Error attempting to save settings:`, settings, e);
        })
        .finally(() => {
          if (process.env.DEBUG) {
            console.info(`Saved multiple settings :`, settings);
          }
        });
    }
  
    async load (setting, defaultValue) {
      let value = await this.get(setting);
      value = value || defaultValue;
      this.set(setting, value);
      return value;
    }
  
    loadAll () {
      for (const k in DEFAULT_SETTINGS) {
        if (DEFAULT_SETTINGS.hasOwnProperty(k)) {
          this.load(k, DEFAULT_SETTINGS[k]);
        }
      }
    }
  
    updateSetting (key, state, callback, condition) {
      const c = condition !== null ? condition : state;
      this.set(key, state);
  
      if (c && callback !== null) {
        callback();
      }
    }
  
    resetAllSettings () {
      const allSettings = { ...DEFAULT_SETTINGS};
      return this.setMultiple(allSettings)
        .then(() => {
          //bugsnagClient.leaveBreadcrumb('Completed reset all settings');
        })
        .catch((e) => {
          //bugsnagClient.notify(e);
          alert('Failed to reset settings. Please try re-installing the extension.');
        });
    }
  
  }