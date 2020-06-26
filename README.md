
# Camera controller

Disclaimer: This project is unfinished and not suitable for a production environment just yet.

## Roadmap to stability

- [ ] Implementation of all known Visca commands
- [ ] Testing with all cameras available
- [ ] Update README
- [ ] Documentation
- [ ] Docker
- [ ] The *Input classes shouldn't feel stupid to use
- [ ] Settings API
- [ ] On system presets
- [ ] Generalised joystick support
- [ ] Slick web interface


**Don't bother reading below this line, a lot of it has been changed and needs updating**

---

## How it works
This application made up a main backend server, which sets out to take any form of input,
and output to any camera (currently limited to VISCA cameras)

It includes a web server as a form of input, which communicates with the client via a WebSocket API.


- [Camera controller](#camera-controller)
  - [Roadmap to stability](#roadmap-to-stability)
  - [How it works](#how-it-works)
- [Reference](#reference)
  - [Action object](#action-object)
    - [`move` parameters](#move-parameters)
    - [`zoom` parameters](#zoom-parameters)
    - [`preset` parameters](#preset-parameters)
  - [Configuration object](#configuration-object)
    - [`camera` object](#camera-object)
    - [`preset` object](#preset-object)


---

# Reference

## Action object

Used by the web client to tell the server what actions should be performed by a given camera

**This may be changed in the future to be able to keep the same general structure of communication between the front-end and server**

```json
{
  "camera": integer,
  "action": {
    "type": string,
    "parameters": {

    }
  }
}
```


| Property     | Explanation                                                    | Valid values                              |
| ------------ | -------------------------------------------------------------- | ----------------------------------------- |
| `camera`     | is the ID of the camera defined in the config                  | Any integer assigned as an ID of a camera |
| `action`     | is an object describing the action to take place on the camera |                                           |
| `type`       | is a string corresponding to the action to be taken            | `"move"`, `"zoom"`, `"preset"`            |
| `parameters` | the parameters in regarding the action                         | See below for each type                   |


### `move` parameters
| Parameters   | Explanation                                     | Valid Values                 |
| ------------ | ----------------------------------------------- | ---------------------------- |
| `pan`        | The horizontal direction the camera should move | `"left"`, `"right"`          |
| `tilt`       | The vertical direction the camera should move   | `"up"`, `"down"`             |
| `pan_speed`  | The speed the camera should pan                 | Integer between `0` and `24` |
| `tilt_speed` | The speed the camera should tilt                | Integer between `0` and `20` |

**Example:**
```json
{
  "camera": 1,
  "action": {
    "type": "move",
    "parameters": {
      "pan": "right",
      "tilt": "up",
      "pan_speed": 4,
      "tilt_speed": 0
    }
  }
}
```


### `zoom` parameters
| Parameters       | Explanation                                           | Valid Values                          |
| ---------------- | ----------------------------------------------------- | ------------------------------------- |
| `zoom_direction` | The direction the camera should zoom, or stop zooming | `"zoomin"`, `"zoomout"`, `"zoomstop"` |
| `zoom_speed`     | The speed the camera should tilt                      | Integer between `0` and `7`           |

**Example:**
```json
{
  "camera": 4,
  "action": {
    "type": "zoom",
    "parameters": {
      "zoom_direction": "zoomout",
      "zoom_speed": 4
    }
  }
}
```

### `preset` parameters
| Parameters      | Explanation                                                   | Valid Values                                   |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| `function`      | The verb to tell the camera what it should do with the preset | `"recall"`, `"set"`, `"reset"`                 |
| `preset_number` | The preset to act on                                          | Any integer assigned to a preset in the system |

**Example:**
```json
{
  "camera": 2,
  "action": {
    "type": "preset",
    "parameters": {
      "function": "recall",
      "preset_number": 6
    }
  }
}
```


---


## Configuration object

Used to store the configuration of the server

**For now this is manual, but in future it should only be changed through the web interface.**

```json
{
  "webserver_port": integer,
  "cameras": []
}
```

| Property       | Explanation                              | Valid values                      |
| -------------- | ---------------------------------------- | --------------------------------- |
| webserver_port | The port the web server should listen on | A valid port number eg. `8000`    |
| cameras        | An array of camera objects               | [`camera` objects](#camera-object) |

**Example:**
```json
{
  "webserver_port": 3000,
  "cameras": [
    {
      "id": 1,
      "friendly_name": "Front left camera",
      "visca_address": 1,
      "host": "192.168.0.21",
      "port": 5678,
      "presets": []
    }, 
    {
      "id": 2,
      "friendly_name": "Centre camera",
      "visca_address": 2,
      "host": "192.168.0.22",
      "port": 5678,
      "presets": []
    }
  ]
}
```

### `camera` object

```json
{
  "id": integer,
  "friendly_name": string,
  "visca_address": integer,
  "host": IP address or hostname,
  "port": integer,
  "presets": []
}
```

| Property          | Explanation                                     | Valid values                      |
| ----------------- | ----------------------------------------------- | --------------------------------- |
| `"id"`            | The id of the camera in the system              | A unique integer per camera       |
| `"friendly_name"` | A human readable descriptor of the camera       | String                            |
| `"visca_address"` | The visca address the camera is set to          | Integer between `0` and `7`       |
| `"host"`          | An address the camera listens to on the network | An IP address, or a hostname eg.  |
| `"port"`          | The port the camera accepts TCP connections on  | A valid port number eg. `5678`    |
| `"presets"`       | An array of preset objects                      | [`preset` objects](#preset-object) |

**Example:**
```json
{
  "id": 2,
  "friendly_name": "Centre camera",
  "visca_address": 2,
  "host": "192.168.0.22",
  "port": 5678,
  "presets": []
}
```


### `preset` object


```json
{
  "id": integer,
  "friendly_name": string,
  "pan_angle": integer,
  "tilt_angle": integer,
}
```

| Property          | Explanation                                                     | Valid values                |
| ----------------- | --------------------------------------------------------------- | --------------------------- |
| `"id"`            | The id of the preset in the system                              | A unique integer per preset |
| `"friendly_name"` | A human readable descriptor of the preset                       | String                      |
| `"pan_position"`  | Signed integer, where each unit represents 1/14 of a degree     | `-2448` - `2448`            |
| `"tilt_position"` | Signed integer, where each unit represents [1/14 of a degree] ? | Unknown                     |
| `"zoom_position"` | Signed integer                                                  | Unknown                     |

The values representing the positions need to be checked. I *think* the `pan_position` explanation is right, but the other two I have no idea
