"use strict";

var co = require('co');

module.exports = ($scope, $state, $http, $timeout, $interval, Webmin, uiModules, summary, UIUtils) => {

  $scope.externalMenus = []

  for (let moduleName of uiModules) {
    const module = window.uiModules[moduleName]
    if (module) {
      $scope.externalMenus.push({
        menuOpen: () => module.menuOpen(summary),
        menuIconClass: module.menuIconClass,
        menuLabel: module.menuLabel
      })
    }
  }

  $scope.notifications = {
    help: []
  };

  Waves.displayEffect();

  var isMobile = require('js/lib/mobileDetector');
  if (isMobile()) {
    $(".button-collapse").sideNav({
      menuWidth: 280
    });
  }

  UIUtils.changeTitle(summary.version);

  let aboutWin;

  $scope.showAbout = () => {
    if (aboutWin) {
      aboutWin.focus();
    } else {
      openWindow(window.location.origin + '/#/about', {
        position: 'center',
        height: 380,
        width: 510
      }, function(subwin) {
        subwin.window.gui = window.gui;
        subwin.on('closed', () => {
          aboutWin = null;
          mainWindow.focus();
        });
        aboutWin = subwin;
      });
    }
  };

  $scope.startServer = () => {
    $scope.server_stopped = false;
    return co(function *() {
      yield Webmin.server.services.startAll();
      $scope.server_started = true;
    });
  };

  $scope.stopServer = () => {
    $scope.server_started = false;
    return co(function *() {
      yield Webmin.server.services.stopAll();
      $scope.server_stopped = true;
    });
  };

  $scope.restartServer = () => {
    return co(function *() {
      yield $scope.stopServer();
      yield $scope.startServer();
    });
  };

  function checkUpdates() {
    const LATEST_RELEASE_URL = 'https://api.github.com/repos/duniter/duniter/releases/latest';
    co(function*() {
      try {
        const latest = yield $http.get(LATEST_RELEASE_URL);
        const local_string_version = 'v' + summary.version;
        const m = local_string_version.match(/^v([\d.]+)([ab]?\d*)/);
        const localVersion = (m && m[1]) || "";
        const localSuffix = m && m[2];
        const isLocalAPreRelease = !!(localSuffix);
        const remoteVersion = latest.data.tag_name.substr(1);
        if (localVersion < remoteVersion || (localVersion == remoteVersion && isLocalAPreRelease)) {
          if ($scope.notifications.help.filter((entry) => entry.message == 'help.new_version_available').length == 0) {
            $scope.notifications.help.push({
              icon: 'play_for_work',
              message: 'help.new_version_available',
              onclick: () => openExternal('https://github.com/duniter/duniter/releases/latest')
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  $interval(checkUpdates, 1000 * 3600);
  $timeout(checkUpdates, 1000);
};
