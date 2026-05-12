import gsap from 'https://esm.sh/gsap@3.13.0';
import Draggable from 'https://esm.sh/gsap@3.13.0/Draggable';
import { Pane } from 'https://esm.sh/tweakpane@4.0.4';
gsap.registerPlugin(Draggable);

const config = {
  theme: 'dark',
  pop: true,
  hue: 43,
  exponent: 1 };


const ctrl = new Pane({
  title: 'config',
  expanded: true });


const update = () => {
  document.documentElement.dataset.theme = config.theme;
  document.documentElement.dataset.pop = config.pop;
  document.documentElement.style.setProperty('--hue', config.hue);
  document.documentElement.style.setProperty('--exp', config.exponent);
};

const sync = event => {
  if (
  !document.startViewTransition ||
  event.target.controller.view.labelElement.innerText !== 'theme')

  return update();
  document.startViewTransition(() => update());
};
ctrl.addBinding(config, 'pop');
ctrl.addBinding(config, 'hue', {
  min: 0,
  max: 359,
  step: 1 });

ctrl.addBinding(config, 'exponent', {
  min: 0.5,
  max: 2,
  step: 0.1 });

ctrl.addBinding(config, 'theme', {
  label: 'theme',
  options: {
    system: 'system',
    light: 'light',
    dark: 'dark' } });



ctrl.on('change', sync);
update();

// make tweakpane panel draggable
const tweakClass = 'div.tp-dfwv';
const d = Draggable.create(tweakClass, {
  type: 'x,y',
  allowEventDefault: true,
  trigger: tweakClass + ' button.tp-rotv_b' });

document.querySelector(tweakClass).addEventListener('dblclick', () => {
  gsap.to(tweakClass, {
    x: `+=${d[0].x * -1}`,
    y: `+=${d[0].y * -1}`,
    onComplete: () => {
      gsap.set(tweakClass, { clearProps: 'all' });
    } });

});

// jus' to trigger the render
const main = document.querySelector('main');
const markup = main.innerHTML;
main.innerHTML = '';
requestAnimationFrame(() => main.innerHTML = markup);