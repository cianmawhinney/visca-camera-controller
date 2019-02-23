// Set options for nipple.js joystick
var joystickOptions = {
  zone: document.getElementById('container-joystick'),
  mode: 'static',
  position: {
    left: '50%',
    top: '50%'
  },
  color: 'red',
  size: 240
}
// Create joystick object with above options
var joystick = nipplejs.create(joystickOptions);


var slider = document.getElementById('container-zoom');
noUiSlider.create(slider, {
  start: 0,
  orientation: 'vertical',
  range: {
    'min': -7,
    'max': 7
  }
});

slider.noUiSlider.on('end', function (values, handle) {
  if (values[handle] != 0) {
    slider.noUiSlider.set(0);
  }
});
