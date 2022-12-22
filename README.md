# VISCA Camera Controller

Disclaimer: This project is unfinished and not suitable for a production environment just yet.

## Visca Command Implementation
- [x] PanTiltDrive
  - [x] set
  - [x] get
- [x] Zoom
  - [x] set
  - [x] get
- [x] Presets
  - [x] get
  - [x] set
- [ ] Focus
  - [ ] set
  - [ ] get
- [ ] ZoomFocus
  - [ ] set
  - [ ] get
- [ ] WhiteBalance
  - [ ] set
  - [ ] get
- [ ] AutoExposure
  - [ ] set
  - [ ] get
- [ ] ShutterSpeed
  - [ ] set
  - [ ] get
- [x] Iris
  - [x] set
  - [x] get
- [ ] Gain
  - [ ] set
  - [ ] get
- [ ] Brightness
  - [ ] set
  - [ ] get
- [ ] ExposureCompensation
  - [ ] set
  - [ ] get
- [x] Menu
  - [x] set
  - [x] get

## Joystick Mapping

The hardcoded values for the joystick are based on the Thrustmaster 1600M with
the following functions being mapped to it:

| type   | number | description                | Camera Function      |
|--------|--------|----------------------------|----------------------|
| button | 0      | "fire"                     | OSD menu on/off      |
| button | 1      | top center                 | OSD menu enter       |
| button | 2      | top left                   | aperture narrower    |
| button | 3      | top right                  | aperture wider       |
| button | 4      | left panel, back left      | camera/preset 1      |
| button | 5      | left panel, back center    | camera/preset 2      |
| button | 6      | left panel, back right     | camera/preset 3      |
| button | 7      | left panel, front right    | camera/preset 6      |
| button | 8      | left panel, front center   | camera/preset 5      |
| button | 9      | left panel, front left     | camera/preset 4      |
| button | 10     | right panel, back right    | camera/preset 7      |
| button | 11     | right panel, back center   | camera/preset 8      |
| button | 12     | right panel, back left     | camera/preset 9      |
| button | 13     | right panel, front left    | camera/preset 10     |
| button | 14     | right panel, front center  | camera/preset 11     |
| button | 15     | right panel, front right   | camera/preset 12     |
| axis   | 0      | main stick horizontal      | pan                  |
| axis   | 1      | main stick vertical        | tilt                 |
| axis   | 2      | main stick rotation        | zoom                 |
| axis   | 3      | front slider               | Camera/preset toggle |
| axis   | 4      | nipple joystick horizontal | OSD menu back/ok     |
| axis   | 5      | nipple joystick vertical   | OSD menu up/down     |

In the future, I'm hopeful I'll find the will to allow these functions to be
configured from the web interface
