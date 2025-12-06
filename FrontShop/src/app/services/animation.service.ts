import { Injectable,  Renderer2, RendererFactory2 } from "@angular/core"

@Injectable({
  providedIn: "root",
})
export class AnimationService {
  private renderer: Renderer2

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null)
  }

  /**
   * Initialize reveal animations for elements with reveal-text and reveal-item classes
   */
  initRevealAnimations() {
    // Set up Intersection Observer
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.renderer.addClass(entry.target, "revealed")

          // Apply transition delay if data-delay attribute exists
          if (entry.target.hasAttribute("data-delay")) {
            const delay = entry.target.getAttribute("data-delay")
            this.renderer.setStyle(entry.target, "transition-delay", `${delay}ms`)
          }

          observer.unobserve(entry.target)
        }
      })
    }, options)

    // Observe all elements with reveal classes
    const elements = document.querySelectorAll(".reveal-text, .reveal-item")
    elements.forEach((element) => {
      observer.observe(element)
    })
  }

  /**
   * Initialize scroll progress indicator
   */
  initScrollProgress() {
    window.addEventListener("scroll", () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = (winScroll / height) * 100

      const progressBar = document.getElementById("scrollProgress")
      if (progressBar) {
        this.renderer.setStyle(progressBar, "width", `${scrolled}%`)
      }
    })
  }

  /**
   * Apply staggered animation delay to elements
   * @param elements Elements to apply staggered animation
   * @param baseDelay Base delay in milliseconds
   * @param increment Increment per element in milliseconds
   */
  applyStaggeredAnimation(elements: NodeListOf<Element>, baseDelay = 0, increment = 100) {
    elements.forEach((element, index) => {
      const delay = baseDelay + index * increment
      this.renderer.setAttribute(element, "data-delay", delay.toString())
    })
  }
}
