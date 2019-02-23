
# Camera controller

## How this works
This application made up a main backend server, which sets out to take any form of input,
and output to any camera (currently limited to VISCA cameras)

It includes a web server as a form of input, which communicates with the client via a WebSocket API.

### JSON WebSockets API Example

```javascript
{
  camera: 1,
  action: {
    type: "move",
    data: {
      pan: "right",
      tilt: "up",
      pan_speed: 18,
      tilt_speed: 9
    }
  }
}

```

unfinished, but hopefully this is enough for now
