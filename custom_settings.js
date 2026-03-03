// Enforce custom settings to overwrite DEFAULTSETTINGS
const CUSTOMSETTINGS = {
  sendUsageStats: false,  // send usage stats to banglejs.com
  alwaysAllowUpdate : true, //  Always show "reinstall app" button regardless of the version
  autoReload: true, //  Automatically reload watch after app App Loader actions (removes "Hold button" prompt))
};
window.addEventListener('load', function () {
    if (JSON.stringify(DEFAULTSETTINGS) == JSON.stringify(SETTINGS)) {
      SETTINGS = Object.assign(DEFAULTSETTINGS, CUSTOMSETTINGS);
      saveSettings();
    }
});