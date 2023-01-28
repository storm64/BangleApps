(function(back) {
  // read settings
  var settings = require("sleeplogtimer").getSettings();

  // from types
  var fromTypes = /*LANG*/"consec.,deep,light".split(",");

  // write change to storage
  function writeSetting() {
    require("Storage").writeJSON("sleeplogtimer.settings.json", settings);
  }

  // read input from keyboard
  function readInput(v, cb) {
    // setTimeout required to load after menu refresh
    setTimeout((v, cb) => {
      if (require("Storage").read("textinput")) {
        g.clear();
        require("textinput").input({text: v}).then(v => cb(v));
      } else {
        E.showAlert(/*LANG*/"No keyboard app installed").then(() => cb());
      }
    }, 0, v, cb);
  }

  // show alarm menu
  function showAlarmMenu() {
    // set menu
    var alarmMenu = {
      "": {
        title: "Alarm Settings"
      },
      /*LANG*/"< Back": () => showMain(3),
      /*LANG*/"msg": {
        value: settings.alarm.msg,
        format: v => !v ? "" : v.length > 6 ? v.substring(0, 6)+"..." : v,
        onchange: v => readInput(v, v => {
          settings.alarm.msg = v;
          writeSetting();
          showMenu(4);
        })
      },
      /*LANG*/"vib pattern": require("buzz_menu").pattern(
        settings.alarm.vibrate,
        v => {
          settings.alarm.vibrate = v;
          writeSetting();
        }
      ),
      /*LANG*/"auto snooze": {
        value: settings.alarm.as,
        onchange: v => {
          settings.alarm.as = v;
          writeSetting();
        }
      },
      /*LANG*/"hidden": {
        value: settings.alarm.hidden,
        onchange: v => {
          settings.alarm.hidden = v;
          writeSetting();
        }
      },
    };
    var menu = E.showMenu(alarmMenu);
  }

  // show filter menu
  function showFilterMenu() {
    // 0 = Sunday (default), 1 = Monday
    const firstDayOfWeek = (require("Storage").readJSON("setting.json", true) || {}).firstDayOfWeek || 0;
    // decode dow to a human readable string
    function decodeDOW(dow) {
      return require("date_utils")
        .dows(firstDayOfWeek, 2)
        .map((day, index) => dow & (1 << (index + firstDayOfWeek)) ? day : "_")
        .join("")
        .toLowerCase();
    }

    // show day of the week menu
    function showDowMenu(dow, cb) {
      // define dow group constants
      const WORKDAYS = 62;
      const WEEKEND = firstDayOfWeek ? 192 : 65;
      const EVERY_DAY = firstDayOfWeek ? 254 : 127;

      // check for a custom dow setup
      var isCustom = dow != WORKDAYS && dow != WEEKEND && dow != EVERY_DAY;

      // define submenu for dow customizing
      function showCustomDaysMenu(dow, cb) {
        // setup menu
        var customDaysMenu = {
          "": { "title": /*LANG*/"Custom Days" },
          "< Back": () => cb(dow || EVERY_DAY)
        };
        // add entry for each day
        require("date_utils").dows(firstDayOfWeek).forEach((day, index) => {
          customDaysMenu[day] = {
            value: !!(dow & (1 << (index + firstDayOfWeek))),
            onchange: v => v ? (dow |= 1 << (index + firstDayOfWeek)) :
              (dow &= ~(1 << (index + firstDayOfWeek)))
          };
        });
        var menu = E.showMenu(customDaysMenu);
      }

      var dowMenu = {
        "": { "title": /*LANG*/"alarm on" },
        "< Back": () => cb(dow),
        /*LANG*/"Workdays": {
          value: dow == WORKDAYS,
          onchange: () => cb(WORKDAYS)
        },
        /*LANG*/"Weekends": {
          value: dow == WEEKEND,
          onchange: () => cb(WEEKEND)
        },
        /*LANG*/"Every Day": {
          value: dow == EVERY_DAY,
          onchange: () => cb(EVERY_DAY)
        },
        /*LANG*/"Custom": {
          value: isCustom ? decodeDOW(dow) : require("date_utils"),
          onchange: () => setTimeout(showCustomDaysMenu, 10, isCustom ? dow : EVERY_DAY, () => E.showMenu(dowMenu))
        }
      };
      var menu = E.showMenu(dowMenu);
    }

    // set menu
    var filterMenu = {
      "": {
        title: "Filter Timer"
      },
      /*LANG*/"< Back": () => showMain(4),
      /*LANG*/"from": {
        value: 0 + settings.filter.fromType,
        min: 0,
        max: 1,
        wrap: true,
        format: v => v ? /*LANG*/"wake up" : /*LANG*/"fall asleep",
        onchange: v => {
          settings.filter.fromType = v === 1;
          writeSetting();
        }
      },
      /*LANG*/"time from": {
        value: settings.filter.from * 60,
        step: 10,
        min: 0,
        max: 1440,
        wrap: true,
        noList: true,
        format: v => (0|v/60) + ":" + ("" + (v%60)).padStart(2, "0"),
        onchange: v => {
          settings.filter.from = v / 60;
          writeSetting();
        }
      },
      /*LANG*/"to": {
        value: 0 + settings.filter.toType,
        min: 0,
        max: 1,
        wrap: true,
        format: v => v ? /*LANG*/"wake up" : /*LANG*/"fall asleep",
        onchange: v => {
          settings.filter.toType = v === 1;
          writeSetting();
        }
      },
      /*LANG*/"time to": {
        value: settings.filter.to * 60,
        step: 10,
        min: 0,
        max: 1440,
        wrap: true,
        noList: true,
        format: v => (0|v/60) + ":" + ("" + (v%60)).padStart(2, "0"),
        onchange: v => {
          settings.filter.to = v / 60;
          writeSetting();
        }
      },
      /*LANG*/"day of week": {
        value: decodeDOW(settings.filter.dow),
        onchange: () => setTimeout(showDowMenu, 100, settings.filter.dow, (dow) => {
          settings.filter.dow = dow;
          writeSetting();
        })
      }
    };
    var menu = E.showMenu(filterMenu);
  }

  // show conditions menu
  function showCondMenu() {
    // set menu
    var condMenu = {
      "": {
        title: "Conditions"
      },
      /*LANG*/"< Back": () => showMain(5),
      /*LANG*/"min true sleep": {
        value: settings.conditions.minTrueSleep,
        step: 10,
        min: 0,
        max: 720,
        wrap: true,
        noList: true,
        format: v => (0|v/60) + ":" + ("" + (v%60)).padStart(2, "0"),
        onchange: v => {
          settings.conditions.minTrueSleep = v;
          writeSetting();
        }
      },
      /*LANG*/"min consec. sleep": {
        value: settings.conditions.minConsecSleep,
        step: 10,
        min: 0,
        max: 720,
        wrap: true,
        noList: true,
        format: v => (0|v/60) + ":" + ("" + (v%60)).padStart(2, "0"),
        onchange: v => {
          settings.conditions.minConsecSleep = v;
          writeSetting();
        }
      }
    };
    var menu = E.showMenu(condMenu);
  }

  // show widget menu
  function showWidMenu() {
    // define color values and names
    var colName = ["red", "yellow", "green", "cyan", "blue", "magenta", "black", "white"];
    var colVal = [63488, 65504, 2016, 2047, 31, 63519, 0, 65535];

    // set menu
    var widgetMenu = {
      "": {
        title: "Widget Settings"
      },
      /*LANG*/"< Back": () => showMain(6),
      /*LANG*/"hide": {
        value: settings.wid.hide,
        onchange: v => {
          settings.wid.hide = v;
          writeSetting();
        }
      },
      /*LANG*/"show time": {
        value: settings.wid.time,
        onchange: v => {
          settings.wid.time = v;
          writeSetting();
        }
      },
      /*LANG*/"color": {
        value: colVal.indexOf(settings.wid.color),
        min: 0,
        max: colVal.length -1,
        wrap: true,
        format: v => colName[v],
        onchange: v => {
          settings.wid.color = colVal[v];
          writeSetting();
        }
      }
    };
    var menu = E.showMenu(widgetMenu);
  }

  // show main menu
  function showMain(selected) {
    // set menu
    var mainMenu = {
      "": {
        title: "Sleep Log Timer",
        selected: selected
      },
      /*LANG*/"< Back": () => back(),
      /*LANG*/"after": {
        value: settings.after * 60,
        step: 10,
        min: 60,
        max: 780,
        wrap: true,
        noList: true,
        format: v => (0|v/60) + ":" + ("" + (v%60)).padStart(2, "0"),
        onchange: v => {
          settings.earlier = v / 60;
          writeSetting();
        }
      },
      /*LANG*/"from first": {
        value: settings.fromType,
        min: 0,
        max: 2,
        wrap: true,
        format: v => fromTypes[settings.fromType],
        onchange: v => {
          settings.fromType = v;
          writeSetting();
        }
      },
      /*LANG*/"Alarm": () => showAlarmMenu(),
      /*LANG*/"Filter Timer": () => showFilterMenu(),
      /*LANG*/"Conditions": () => showCondMenu(),
      /*LANG*/"Widget": () => showWidMenu(),
      /*LANG*/"Enabled": {
        value: settings.enabled,
        onchange: v => {
          settings.enabled = v;
          writeSetting();
        }
      }
    };
    var menu = E.showMenu(mainMenu);
  }

  // draw main menu
  showMain();
})
