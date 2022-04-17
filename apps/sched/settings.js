(function (back) {

  const FILE = "sched.settings.json";

  let settings = Object.assign({
    unlockAtBuzz: false,
    autoSnooze: false,
    snoozeMillis: 600000, // 10min
    buzzCount: 10,
    buzzIntervalMillis: 3000,
    buzzPatternAlarms: "..",
    buzzPatternTimers: ".."
  }, require("Storage").readJSON(FILE, true) || {});

  function writeSettings() {
    require("Storage").writeJSON(FILE, settings);
  }

  E.showMenu({

    "": { "title": /*LANG*/"Scheduler" },

    /*LANG*/"< Back": () => back(),

    /*LANG*/"Unlock at Buzz": {
      value: settings.unlockAtBuzz,
      format: v => v ? /*LANG*/"Yes" : /*LANG*/"No",
      onchange: v => {
        settings.unlockAtBuzz = v;
        writeSettings();
      }
    },

    /*LANG*/"Auto Snooze": {
      value: settings.autoSnooze,
      format: v => v ? /*LANG*/"Yes" : /*LANG*/"No",
      onchange: v => {
        settings.autoSnooze = v;
        writeSettings();
      }
    },

    /*LANG*/"Snooze": {
      value: settings.snoozeMillis / 60000,
      min: 5,
      max: 30,
      step: 5,
      format: v => v + /*LANG*/" min",
      onchange: v => {
        settings.snoozeMillis = v * 60000;
        writeSettings();
      }
    },

    /*LANG*/"No. Buzz": {
      value: settings.buzzCount,
      min: 5,
      max: 15,
      step: 1,
      onchange: v => {
        settings.buzzCount = v;
        writeSettings();
      }
    },

    /*LANG*/"Buzz Interval": {
      value: settings.buzzIntervalMillis / 1000,
      min: 1,
      max: 5,
      step: 1,
      format: v => v + /*LANG*/"s",
      onchange: v => {
        settings.buzzIntervalMillis = v * 1000;
        writeSettings();
      }
    },

    /*LANG*/"Alarms Pattern": require("buzz_menu").pattern(settings.buzzPatternAlarms, v => {
      settings.buzzPatternAlarms = v;
      writeSettings();
    }),

    /*LANG*/"Timers Pattern": require("buzz_menu").pattern(settings.buzzPatternTimers, v => {
      settings.buzzPatternTimers = v;
      writeSettings();
    })

  });

});