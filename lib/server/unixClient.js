const net = require("net");

module.exports = function (prjFolder, socketAddress) {
  var projectFolder = prjFolder;
  var queryIdx = 0;
  var message = "";
  var listeners = {
    search: {},
    error: {}
  };

  // prevent duplicate exit messages
  var SHUTDOWN = false;

  console.log("Connecting to server.");

  var client = net.createConnection(socketAddress);
  client.on("connect", () => {
    console.log("Connected to search service via Unix socket: ", socketAddress);
    postMessage('initialize', projectFolder);
  });

  // Messages are buffers and have to be converted into strings
  // Unix responses contain
  // - a verb representing the action happened on the server side
  // - the client id of the webclient
  // - the data, i.e. search results
  // separated by a pipe char, e.g. "search|c823984|{...data}"
  client.on("data", function (data) {
    message += data.toString();

    if (message.indexOf("␄") !== -1) {
      message = message.replace("␄", "");
      var json = JSON.parse(message);
      switch (json.action) {
        case "search":
          var cb = listeners.search[json.queryId];
          cb && cb(null, json.data);
          delete listeners.search[json.queryId];
          break;
        default:
          console.warn("Unix Socket action not known.");
      }
      message = "";
    }

    if (data === "__disconnect") {
      console.log("Server disconnected.");
      return cleanup();
    }
  });

  client.on("error", function (err) {
    if (listeners.error[queryIdx]) {
      listeners.error[queryIdx](err);
      delete listeners.error[queryIdx];
    }
  });

  function cleanup() {
    if (!SHUTDOWN) {
      SHUTDOWN = true;
      console.log("\n", "Terminating.", "\n");
      client.end();
      process.exit(0);
    }
  }

  process.on("SIGINT", cleanup);

  function postMessage(action, data, callback) {
    var qId = "c_" + queryIdx;
    var msg = action + "|" + qId;

    if (callback && !listeners[action].hasOwnProperty(qId)) {
      listeners[action][qId] = callback;
      listeners.error[queryIdx] = callback;
    }

    if (data) {
      msg += "|" + data;
    }

    msg += "\n";

    client.write(msg);
    queryIdx++;
  }

  return {
    search: function(searchTerm, callback) {
      postMessage('search', searchTerm, callback);
    },
    invalidate: function() {
      postMessage('invalidate');
    }
  };
};
