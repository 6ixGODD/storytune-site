import gsap from 'https://esm.sh/gsap@3.13.0'
import Draggable from 'https://esm.sh/gsap@3.13.0/Draggable'
import { Pane } from 'https://esm.sh/tweakpane@4.0.4'
gsap.registerPlugin(Draggable)

const config = {
  theme: 'system',
  bordered: true,
  translate: true,
  highlight: true,
  depth: false,
  style: 'border',
  // content settings
  blur: 4,
  border: 2,
  opacity: 0.4,
  translateY: 1,
  translateDepth: 0.5,
  translateMargin: 1.5,
  speed: 1,
}

const ctrl = new Pane({
  title: 'config',
  expanded: true,
})

const update = () => {
  document.documentElement.dataset.theme = config.theme
  document.documentElement.dataset.bordered = config.bordered
  document.documentElement.dataset.translate = config.translate
  document.documentElement.dataset.highlight = config.highlight
  document.documentElement.dataset.depth = config.depth
  document.documentElement.dataset.style = config.style
  document.documentElement.style.setProperty('--blur', config.blur)
  document.documentElement.style.setProperty('--border-width', `${config.border}px`)
  document.documentElement.style.setProperty('--opacity', config.opacity)
  document.documentElement.style.setProperty('--translate-y', config.translateY)
  document.documentElement.style.setProperty('--translate-depth', config.translateDepth)
  document.documentElement.style.setProperty('--translate-margin', config.translateMargin)
  document.documentElement.style.setProperty('--speed', config.speed)
}

const sync = (event) => {
  if (
    !document.startViewTransition ||
    event.target.controller.view.labelElement.innerText !== 'theme'
  )
    return update()
  document.startViewTransition(() => update())
}

ctrl.addBinding(config, 'highlight')
ctrl.addBinding(config, 'bordered')
ctrl.addBinding(config, 'translate')
ctrl.addBinding(config, 'depth')
ctrl.addBinding(config, 'style', {
  label: 'style',
  options: {
    border: 'border',
    'shadow [tbd]': 'shadow',
    'outline [tbd]': 'outline',
    pseudo: 'pseudo',
  },
})

const settingsFolder =ctrl.addFolder({ title: 'settings', expanded: false })
settingsFolder.addBinding(config, 'border', {
  min: 0,
  max: 10,
  step: 1
})
settingsFolder.addBinding(config, 'blur', {
  min: 0,
  max: 10,
  step: 1,
  label: 'blur [content]'
})
settingsFolder.addBinding(config, 'opacity', {
  min: 0,
  max: 1,
  step: 0.1,
  label: 'opacity [content]'
})
settingsFolder.addBinding(config, 'translateY', {
  min: 0,
  max: 10,
  step: 1,
  label: 'y [content]'
})
settingsFolder.addBinding(config, 'translateDepth', {
  min: 0,
  max: 10,
  step: 0.1,
  label: 'depth'
})
settingsFolder.addBinding(config, 'translateMargin', {
  min: 0,
  max: 10,
  step: 1,
  label: 'margin',
})
settingsFolder.addBinding(config, 'speed', {
  min: 0.1,
  max: 2,
  step: 0.1,
  label: 'speed'
})
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

/**
 * Measures the heights of all .content panels inside details elements
 * by temporarily opening each details element, measuring, then closing it.
 * @returns {Map<HTMLElement, number>} Map of details elements to their content heights
 */
function measureContentHeights() {
  const details = document.querySelectorAll('details')
  const heights = new Map()
  const container = document.querySelector('.morphing-disclosure')
  
  // Temporarily hide the container to prevent visual flicker
  const originalVisibility = container.style.visibility
  container.style.visibility = 'hidden'
  
  // Process each details element
  details.forEach((detail) => {
    // Check if already open
    const wasOpen = detail.hasAttribute('open')
    
    // Open it temporarily
    if (!wasOpen) {
      detail.setAttribute('open', '')
    }
    
    // Force reflow to ensure DOM is updated
    detail.offsetHeight
    
    // Measure the content height
    const content = detail.querySelector('.content')
    if (content) {
      const height = Math.ceil(content.getBoundingClientRect().height)
      heights.set(detail, height)
      
      // Store height as data attribute for easy access
      detail.style.setProperty('--content-height', `${height}px`)
    }
    
    // Close it if it wasn't originally open
    if (!wasOpen) {
      detail.removeAttribute('open')
    }
  })
  
  // Restore visibility
  container.style.visibility = originalVisibility
  
  return heights
}

// Measure heights on load
measureContentHeights()

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
