import { Pane } from 'https://esm.sh/tweakpane@4.0.4';
import Splitting from 'https://esm.sh/splitting';

const main = document.querySelector('main');

const config = {
  theme: 'system',
  debug: false,
  scrub: false,
  progress: 0 };


const ctrl = new Pane({
  title: 'Config',
  expanded: true });


let scrubber;
let progress;

const update = () => {
  document.documentElement.dataset.debug = config.debug;
  document.documentElement.dataset.theme = config.theme;
  document.documentElement.dataset.scrub = config.scrub;
  document.documentElement.style.setProperty('--progress', config.progress);
  if (scrubber) scrubber.hidden = !config.debug;
  if (progress) {
    progress.hidden = !config.debug;
    progress.disabled = !config.scrub;
  }
};

const sync = event => {
  if (
  !document.startViewTransition ||
  event.target.controller.view.labelElement.innerText !== 'Theme')

  return update();
  document.startViewTransition(() => update());
};

ctrl.addBinding(config, 'debug', {
  label: 'Debug' });


scrubber = ctrl.addBinding(config, 'scrub', {
  label: 'Scrub',
  hidden: true });


progress = ctrl.addBinding(config, 'progress', {
  min: 0,
  max: 100,
  step: 1,
  label: 'Progress',
  disabled: true });


ctrl.addBinding(config, 'theme', {
  label: 'Theme',
  options: {
    System: 'system',
    Light: 'light',
    Dark: 'dark' } });



ctrl.on('change', sync);
update();
Splitting();