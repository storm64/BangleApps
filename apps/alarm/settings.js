(function (back) {
  function showSettingsMenu() {
    const FILE = "alarm.json";
    let settings = Object.assign({ saveOnBack: false }, require("Storage").readJSON(FILE, true) || {});

    E.showMenu({
      "": { "title": /*LANG*/"Alarms&Timers" },

      /*LANG*/"< Back": () => back(),

      /*LANG*/"Save on Back": {
        value: settings.saveOnBack,
        format: v => v ? /*LANG*/"On" : /*LANG*/"Off",
        onchange: v => {
          settings.saveOnBack = v;
          require("Storage").writeJSON(FILE, settings);
        }
      },

    /*LANG*/"Scheduler": () => {
        eval(require("Storage").read("sched.settings.js"))(showSettingsMenu);
      }
    });
  }

  showSettingsMenu();
});
