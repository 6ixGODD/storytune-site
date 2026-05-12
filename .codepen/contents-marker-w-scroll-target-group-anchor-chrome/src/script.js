import gsap from 'https://esm.sh/gsap@3.13.0'
import Draggable from 'https://esm.sh/gsap@3.13.0/Draggable'
import { Pane } from 'https://esm.sh/tweakpane@4.0.4'
gsap.registerPlugin(Draggable)

const config = {
  theme: 'system',
  accentLight: 'hsl(0, 100%, 56%)',
  accentDark: 'hsl(164, 100%, 56%)',
  align: 'right',
}

const ctrl = new Pane({
  title: 'config',
  expanded: false,
})

const update = () => {
  document.documentElement.dataset.theme = config.theme
  document.documentElement.style.setProperty('--accent-light', config.accentLight)
  document.documentElement.style.setProperty('--accent-dark', config.accentDark)
  document.documentElement.dataset.align = config.align
}

const sync = (event) => {
  if (
    !document.startViewTransition ||
    event.target.controller.view.labelElement.innerText !== 'theme'
  )
    return update()
  document.startViewTransition(() => update())
}

ctrl.addBinding(config, 'accentLight', { label: 'accent light' })
ctrl.addBinding(config, 'accentDark', { label: 'accent dark' })
ctrl.addBinding(config, 'align', { label: 'align', options: { left: 'left', right: 'right' } })

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

function generateTableOfContents() {
  const tocElement = document.querySelector('table-of-contents')
  if (!tocElement) return

  const article = document.querySelector('article')
  if (!article) return

  // Find all headings within the article (h2 and below only)
  const headings = Array.from(article.querySelectorAll('h2, h3, h4, h5, h6'))
  if (headings.length === 0) return

  // Build hierarchical structure
  const buildTOC = (items, startIndex = 0, currentLevel = 1) => {
    const list = document.createElement('ol')
    let index = startIndex
    
    while (index < items.length) {
      const item = items[index]
      const level = parseInt(item.tagName.charAt(1))
      
      if (level < currentLevel) {
        break
      }
      
      if (level === currentLevel) {
        const listItem = document.createElement('li')
        const link = document.createElement('a')
        
        const id = item.id || item.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
        if (!item.id) {
          item.id = id
        }
        
        link.href = `#${id}`
        link.textContent = item.textContent.trim()
        
        listItem.appendChild(link)
        index++
        
        // Check if there are nested items
        if (index < items.length) {
          const nextLevel = parseInt(items[index].tagName.charAt(1))
          if (nextLevel > currentLevel) {
            const result = buildTOC(items, index, currentLevel + 1)
            listItem.appendChild(result.list)
            index = result.nextIndex
          }
        }
        
        list.appendChild(listItem)
      } else {
        break
      }
    }
    
    return { list, nextIndex: index }
  }

  // Create nav element with proper accessibility
  const nav = document.createElement('nav')
  nav.setAttribute('aria-label', 'Table of Contents')
  
  const heading = document.createElement('h2')
  heading.textContent = 'Contents'
  nav.appendChild(heading)
  
  const result = buildTOC(headings, 0, 2)
  nav.appendChild(result.list)
  const split = document.createElement('hr')
  split.classList.add('split')
  nav.appendChild(split)
  const backToTop = document.createElement('div')
  backToTop.classList.add('back-to-top')
  backToTop.innerHTML = `
  <a aria-label="Back to Top" href="#pre">
  top <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="m11.99 7.5 3.75-3.75m0 0 3.75 3.75m-3.75-3.75v16.499H4.49" />
  </svg>
  </a>
  `

  nav.appendChild(backToTop)
  tocElement.appendChild(nav)
}
generateTableOfContents()
