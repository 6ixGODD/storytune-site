import { Pane } from 'https://esm.sh/tweakpane@4.0.4';

const config = {
  theme: 'system',
  animate: true,
  debug: false,
  hue: 0,
  start: 50,
  space: 50 };


const ctrl = new Pane({
  title: 'config',
  expanded: false });


const update = () => {
  document.documentElement.dataset.theme = config.theme;
  document.documentElement.dataset.animate = config.animate;
  document.documentElement.dataset.debug = config.debug;
  document.documentElement.style.setProperty('--hue', config.hue);
  document.documentElement.style.setProperty('--start', `${config.start}vh`);
  document.documentElement.style.setProperty('--space', `${config.space}vh`);
};

const sync = event => {
  if (
  !document.startViewTransition ||
  event.target.controller.view.labelElement.innerText !== 'Theme')

  return update();
  document.startViewTransition(() => update());
};
ctrl.addBinding(config, 'hue', {
  label: 'hue',
  min: 0,
  max: 359,
  step: 1 });

ctrl.addBinding(config, 'start', {
  label: 'start (vh)',
  min: 10,
  max: 50,
  step: 1 });

ctrl.addBinding(config, 'space', {
  label: 'margin (vh)',
  min: 10,
  max: 100,
  step: 1 });

ctrl.addBinding(config, 'animate', {
  label: 'animate' });

// ctrl.addBinding(config, 'debug', {
//   label: 'debug',
// })

ctrl.addBinding(config, 'theme', {
  label: 'theme',
  options: {
    System: 'system',
    Light: 'light',
    Dark: 'dark' } });



ctrl.on('change', sync);
// run it
update();