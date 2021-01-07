//
// Boilerplate
//
function betterPromise() { //Returns a promise we can resolve from the outside
	var res, rej;
	var promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});
	promise.resolve = res;
	promise.reject = rej;
	return promise;
}
// window.loaded but it's a promise instead of an event
var siteLoaded = betterPromise();
window.addEventListener('load', _ => { siteLoaded.resolve(this) });

//
// MasterSwitch
//
let masterswitch = document.getElementById('masterswitch');
let maindiv = document.getElementById('maindiv');
var mainDivVisible = betterPromise();
masterswitch.onchange = function() {
  if (masterswitch.checked) {
    start();
  } else {
    stop();
  }
}
function gotPingback(data) {
  console.log("pingback", data)
  if (data.isRunning) {
    masterswitch.checked = true;
    maindiv.style.display = "block";
    siteLoaded.then(_ => { mainDivVisible.resolve() }); //lambda is needed for this to work
  } else {
    masterswitch.checked = false;
    maindiv.style.display = "none";
  }
}

// 
// Section headers
// 
let headers = document.getElementsByClassName("header");
function hide(content) { content.style.maxHeight = 0; }
function show(content) { content.style.maxHeight = content.scrollHeight + "px"; }
for (let i = 0; i < headers.length; i++) {
  let checkbox = headers[i].firstElementChild
  let content = headers[i].nextElementSibling
  let name = checkbox.id

  checkbox.toggle = function() {
    if (this.checked) {
      this.checked = false;
      hide(content)
    } else {
      this.checked = true;
      show(content)
    }
    localStorage.setItem(name, this.checked)
  };

  headers[i].addEventListener("click", function() {
    checkbox.toggle();
  });
  
  if (localStorage.getItem(name) == "true") {
    checkbox.checked = true;
     // Inits maxHeight when item is first displayed, so it can animate later
     mainDivVisible.then( _ => { show(content) });
  } else {
    hide(content)
  }
  asd = content

}

//
// ServiceWorker
//
let activeRegistration = betterPromise();
const broadcast = new BroadcastChannel('pingback-channel');
broadcast.addEventListener("message", e => gotPingback(e.data))
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
  } else {
    activeRegistration.then(reg => reg.active.postMessage("start"));
  }
  
}
function stop() {
  activeRegistration.then(reg => reg.active.postMessage("stop"));
}
navigator.serviceWorker.getRegistration('/service.js')
.then(reg => {
  if (reg) {
    console.log('Found existing registration');
    activeRegistration.resolve(reg);
  } else {
    console.log('No registration found, starting it');
    navigator.serviceWorker.register('/service.js')
    .then(reg => {
      if (reg.active) {
        console.log("active, it's our lucky day")
        activeRegistration.resolve(reg)
      } else {
        let notActive = reg.installing || reg.waiting
        console.log('not active yet (' + notActive.state + ')')
        notActive.addEventListener('statechange', e => {
          console.log('statechange', notActive.state)
          if (notActive.state == "activated") {
            console.log('resolving')
            activeRegistration.resolve(reg)
          }
        });
      }
    }).catch(function(error) {
      console.log('Registration failed with ' + error);
      activeRegistration.reject(error)
    });
  }
})
activeRegistration.then(reg => reg.active.postMessage("query"));
//activeRegistration.then(reg => console.log("Registration ready", reg));
function unregister() { // UNUSED
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for(let registration of registrations) {
      registration.unregister()
    }
    console.log('stopped');
  }).catch(_ => console.log('Service Worker unregistration failed: ', err));
}
