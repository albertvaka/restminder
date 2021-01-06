let status = document.getElementById('status');
let masterswitch = document.getElementById('masterswitch');
let maindiv = document.getElementById('maindiv');


function gotPingback(data) {
  localStorage.setItem("running", data.isRunning)
  updateUi();
}

function togglerino() {
  if (masterswitch.checked) {
    start();
  } else {
    stop();
  }
}

function start() {
  if (Notification.permission != "granted") {
    masterswitch.checked = false;
    if (Notification.permission === "denied") {
      alert("Notifications must be allowed for this to work")
    }
    Notification.requestPermission(function (result) {
      if (Notification.permission != "granted") {
      } else {
        activeRegistration.then(reg => reg.active.postMessage("start"));
      }
    });
  }else {
    activeRegistration.then(reg => reg.active.postMessage("start"));
  }
  
}
function stop() {
  activeRegistration.then(reg => reg.active.postMessage("stop"));
}

function updateUi() {
  if (localStorage.getItem("running") === "true") {
    masterswitch.checked = true;
    maindiv.style.display = ""
  } else {
    masterswitch.checked = false;
    maindiv.style.display = "none"
  }
}

let activeRegistration = new Promise(function(resolve, reject) {
  navigator.serviceWorker.getRegistration('/service.js')
  .then(reg => {
    if (reg) {
      console.log('Found existing registration');
      resolve(reg);
    } else {
      console.log('No registration found');
      document.getElementById('swstatus').textContent = 'starting...';
      navigator.serviceWorker.register('/service.js')
      .then(reg => {
        if (reg.active) {
          console.log("active, it's our lucky day")
          resolve(reg)
        } else {
          let notActive = reg.installing || reg.waiting
          console.log('not active yet (' + notActive.state + ')')
          notActive.addEventListener('statechange', e => {
            console.log('statechange', notActive.state)
            if (notActive.state == "activated") {
              console.log('resolving')
              resolve(reg)
            }
          });
        }
      }).catch(function(error) {
        console.log('Registration failed with ' + error);
        reject(error)
      });
    }
  })
})

activeRegistration
.then(e => document.getElementById('swstatus').textContent = 'running')
.catch(e => document.getElementById('swstatus').textContent = 'error ' + e)

activeRegistration.then(reg => reg.active.postMessage("query"));

//activeRegistration.then(reg => console.log("Registration ready", reg));

function unregister() {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for(let registration of registrations) {
      registration.unregister()
    }
    console.log('stopped');
  }).catch(_ => console.log('Service Worker unregistration failed: ', err));
}


const broadcast = new BroadcastChannel('pingback-channel');
broadcast.addEventListener("message", e => gotPingback(e.data))