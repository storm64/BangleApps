// Enforce custom settings to overwrite DEFAULTSETTINGS
const CUSTOMSETTINGS = {
  language : "de_DE",
  sendUsageStats: false,  // send usage stats to banglejs.com
  alwaysAllowUpdate : true, //  Always show "reinstall app" button regardless of the version
  autoReload: true, //  Automatically reload watch after app App Loader actions (removes "Hold button" prompt))
};
if (DEFAULTSETTINGS == SETTINGS) {
    SETTINGS = JSON.parse(JSON.stringify(CUSTOMSETTINGS)); // clone
}