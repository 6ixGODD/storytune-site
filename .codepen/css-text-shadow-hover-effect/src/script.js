import gsap from 'https://esm.sh/gsap@3.13.0'
import Draggable from 'https://esm.sh/gsap@3.13.0/Draggable'
import { Pane } from 'https://esm.sh/tweakpane@4.0.4'
gsap.registerPlugin(Draggable)

const config = {
  theme: 'system',
  directional: true,
  revert: true,
  explode: false,
  color: 'hsl(177,90%,50%)',
}

const ctrl = new Pane({
  title: 'config',
  expanded: true,
})
const nav = document.querySelector('nav')
const update = () => {
  document.documentElement.dataset.theme = config.theme
  nav.dataset.directional = config.directional
  nav.dataset.revert = config.revert
  nav.dataset.explode = config.explode
  nav.style.setProperty('--color', config.color)
}

const sync = (event) => {
  if (
    !document.startViewTransition ||
    event.target.controller.view.labelElement.innerText !== 'theme'
  )
    return update()
  document.startViewTransition(() => update())
}

ctrl.addBinding(config, 'directional')
ctrl.addBinding(config, 'revert')
ctrl.addBinding(config, 'explode')
ctrl.addBinding(config, 'color')
ctrl.addBinding(config, 'theme', {
  label: 'theme',
  options: {
    system: 'system',
    light: 'light',
    dark: 'dark',
  },
})

ctrl.on('change', sync)
update()

// make tweakpane panel draggable
const tweakClass = 'div.tp-dfwv'
const d = Draggable.create(tweakClass, {
  type: 'x,y',
  allowEventDefault: true,
  trigger: tweakClass + ' button.tp-rotv_b',
})
document.querySelector(tweakClass).addEventListener('dblclick', () => {
  gsap.to(tweakClass, {
    x: `+=${d[0].x * -1}`,
    y: `+=${d[0].y * -1}`,
    onComplete: () => {
      gsap.set(tweakClass, { clearProps: 'all' })
    },
  })
})
