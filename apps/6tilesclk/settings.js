(function(back) {
  let jsonFile = "6tilesclk.settings.json";

  // overwrite default values with settings from file
  let settings = Object.assign({
    frameColor: 33808,
    fullscreen: false,
    is12Hour: false,
    leading0: true,
    loadWidgets: true,
    woy: "",
    dateLine: ["date", "dow", "woy"],
    tiles: [{},{},{},{},{},{}]
  }, require("Storage").readJSON(jsonFile, true) || {});

  // function to write changes to storage
  let save = function(key, value) {
    settings[key] = value;
    require("Storage").writeJSON(jsonFile, settings);
  };

  // define menu object and open menu function
  let menu = {};
  let openMenu = () => setTimeout(E.showMenu, 0, menu);

  // function to set and open the main menu
  let openMainMenu = function(selected) {
    // set main menu as array
    menu = [{
      title: /*LANG*/"Clock Settings",
      onchange: () => openClockMenu()
    },{
      title: /*LANG*/"Date Settings",
      onchange: () => openDateMenu()
    },{
      title: /*LANG*/"Tile Filter:",
      onchange: () => openTileMenu(i)
    }];
    // add main menu entries for each tile
    [0, 1, 2, 3, 4, 5].forEach(i => menu.push({
      title: (settings.tiles[i].menuA || /*LANG*/"not filtered") + "\n" +
         (settings.tiles[i].menuB || /*LANG*/"not filtered"),
      value: (/*LANG*/"Tile").substr(0, 1) + (i+1) + " >",
      onchange: () => openTileMenu(i)
    }));
    // add title and back elements
    menu[""] = {
      title: "6 Tiles Clock",
      selected: selected
    };
    menu[/*LANG*/"< Back"] = back;
    // open main menu
    openMenu();
  };

  // function to set and open the clock menu
  let openClockMenu = function() {
    // define colors
    let colNames = (/*LANG*/"grey,red,yellow,green,cyan,blue,magenta," + 
                    "fg,bg,fg2,bg2,fgH,bgH").split(",");
    let colVals = [33808, 63488, 65504, 2016, 2047, 31, 63519,
                   "fg", "bg", "fg2", "bg2", "fgH", "bgH"];
    // set clock menu
    menu = {
      "": {
        title: /*LANG*/"Clock Settings"
      },
      /*LANG*/"< Back": () => openMainMenu(1),
      /*LANG*/"Frame Color": {
        value: colVals.indexOf(settings.frameColor),
        min: 0,
        max: colVals.length - 1,
        format: v => colNames[v],
        onchange: v => save("frameColor", colVals[v])
      },
      /*LANG*/"Fullscreen": {
        value: settings.fullscreen,
        onchange: v => save("fullscreen", v)
      },
      /*LANG*/"12h Format": {
        value: settings.is12Hour,
        onchange: v => save("is12Hour", v)
      },
      /*LANG*/"Hour Format": {
        value: settings.leading0,
        format: v => v ? "'01'" : "' 1'",
        onchange: v => save("leading0", v)
      },
      /*LANG*/"Load Widgets": {
        value: settings.loadWidgets,
        onchange: v => save("loadWidgets", v)
      }
    };
    // open clock menu
    openMenu();
  };

  // function to set and open the date menu
  let openDateMenu = function(selected) {
    // function to read input from keyboard
    let readInput = function(v, cb) {
      // setTimeout required to load after menu refresh
      setTimeout((v, cb) => {
        if (require("Storage").read("textinput")) {
          g.clear();
          require("textinput").input({text: v}).then(v => cb(v));
        } else {
          E.showAlert(/*LANG*/"No keyboard app installed").then(() => cb());
        }
      }, 0, v, cb);
    };
    // set date menu
    menu = {
      "": {
        title: /*LANG*/"Date Settings",
        selected: selected
      },
      /*LANG*/"< Back": () => openMainMenu(2),
      /*LANG*/"Week Prefix": {
        value: settings.woy,
        format: v => !v ? (/*LANG*/"Week").substr(0, 1) : v.length > 6 ? v.substring(0, 6)+"..." : v,
        onchange: v => readInput(v, v => {
          save("woy", v);
          openDateMenu(1);
        })
      }
    };
    // function to get menu entry
    let menuEntry = {
      value: settings.dateLine,
      format: v => "",
      onchange: v => openDateLineMenu()
    };
    // add title and value for date line order
    menu[/*LANG*/"Element Order:"] = menuEntry;
    menu["-> " + settings.dateLine.join(" ")] = menuEntry;
    // open date menu
    openMenu();
  };

  // function to set and open the date line menu
  let openDateLineMenu = function() {
    // define date line elements
    let elements = ["date", "dow", "woy"];
    let names = /*LANG*/"date,day of week,week of year".split(",");
    // set date line menu
    menu = {
      "": {
        title: /*LANG*/"Date Line"
      },
      /*LANG*/"< Back": () => openDateMenu(2)
    };
    // add selection for each position
    [0, 1, 2].forEach(p => {
      menu[/*LANG*/"left,center,right".split(",")[p]] = {
        value: elements.indexOf(settings.dateLine[p]),
        min: 0,
        max: elements.length - 1,
        format: v => names[v],
        onchange: v => {
          settings.dateLine[p] = elements[v];
          save("dateLine", settings.dateLine);
        }
      };
    });
    // open date line menu
    openMenu();
  };

  // function to set and open the tile menu to the selected tile number
  let openTileMenu = function(i, selected) {
    // set tile menu
    menu = {
      "": {
        title: /*LANG*/"Tile " + (i+1) + /*LANG*/" Filters",
        selected: selected
      },
      /*LANG*/"< Back": () => openMainMenu(3 + i)
    };
    // function to get filter
    let getFilter = function(menuA, count) {
      let filter = {
        value: settings.tiles[i][menuA ? "menuA" : "menuB"] || "",
        format: v => count && v ? v.split(",").length : "",
        onchange: v => openSelectMenu(i, menuA)
      };
      return filter.clone();
    };
    // add group or element filter with title and count or elements as title
    menu[/*LANG*/"Groups:"] = getFilter(true, true);
    menu["-> " + (settings.tiles[i].menuA || /*LANG*/"not filtered")] =
      getFilter(true, false);
    menu[/*LANG*/"Elements:"] = getFilter(false, true);
    menu["-> " + (settings.tiles[i].menuB || /*LANG*/"not filtered")] =
      getFilter(false, false);
    // open tile menu
    openMenu();
  };

  // function to set and open the selection menu to the selected category
  let openSelectMenu = function(i, menuA) {
    // read and prepare clock_info elements
    let clkInfoElem = {};
    require("clock_info").load().forEach(mA => {
      if (typeof mA.name === "string") clkInfoElem[mA.name] =
        mA.items.map(mB => mB.name).filter(mB => typeof mB === "string");
    });
    // set select menu
    menu = {
      "": {
        title: (/*LANG*/"Tile").substr(0, 1) + (i+1) + (menuA ? /*LANG*/" Groups" : /*LANG*/" Elements")
      },
      /*LANG*/"< Back": () => openTileMenu(i, menuA ? 1 : 3)
    };
    // function to save changes
    let onchange = () => {
      settings.tiles[i][menuA ? "menuA" : "menuB"] = Object.keys(menu).filter(k => menu[k].value === true).join(",");
      save("tiles", settings.tiles);
    };
    // get menuA filter value from settings
    let mAFilter = settings.tiles[i].menuA || "";
    // loop through groups
    Object.keys(clkInfoElem).forEach(g => {
      if (menuA) {
        // add groups as booleans
        menu[g] = {
          value: mAFilter.includes(g),
          onchange: onchange
        };
      } else {
        // check if group is included in filter if filter is set
        if (!mAFilter || mAFilter.includes(g)) clkInfoElem[g].forEach(e => {
          // add elements as booleans
          menu[e] = {
            value: (settings.tiles[i].menuB || "").includes(e),
            onchange: onchange
          };
        });
      }
    });
    // open select menu
    openMenu();
  };

  // show main menu
  openMainMenu();
})