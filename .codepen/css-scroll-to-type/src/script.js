import { Pane } from 'https://esm.sh/tweakpane@4.0.4'

const config = {
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi aliquet nulla ac magna semper, at condimentum orci ultrices.',
  theme: 'system',
}

const heading = document.querySelector('h1')
const span = heading.querySelector('span')

const ctrl = new Pane({
  title: 'Config',
  expanded: true,
})

const update = () => {
  span.innerHTML = `${config.text} `
  heading.style.setProperty('--text-length', config.text.length + 1)
  document.documentElement.dataset.theme = config.theme
}

const sync = (event) => {
  if (
    !document.startViewTransition ||
    event.target.controller.view.labelElement.innerText !== 'Theme'
  )
    return update()
  document.startViewTransition(() => update())
}

ctrl.addBinding(config, 'theme', {
  label: 'Theme',
  options: {
    System: 'system',
    Light: 'light',
    Dark: 'dark',
  },
})

ctrl.on('change', sync)
update()
