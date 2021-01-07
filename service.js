
//self.addEventListener('activate', event => console.log('hi from service!', self));

const broadcast = new BroadcastChannel('pingback-channel');

var running = false;

function pingback() {
  broadcast.postMessage({
    isRunning: running,
  });
}
function start() {
  console.log("Starterino!")
  running = true;
  pingback();
}

function stop() {
  console.log("Stoperino!")
  running = false;
  pingback();
}

self.addEventListener('message', event => {
  switch(event.data) {
    case "start": start(); break;
    case "stop": stop(); break;
    case "query": pingback(); break;
    default: console.log("Unexpected event", event);
  }
});
