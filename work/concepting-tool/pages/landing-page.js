console.clear()

let topNav = [].slice.call(document.querySelector('.top-nav').children)

topNav.forEach((el, i) => {
  if (i > 0 && el.nextSibling.nodeType === 1 && el.tagName === "UL") {
    getLastElSibling(el.previousSibling).classList.add('has-submenu')
  }
})

function getLastElSibling(el) {
  if (!el || !el.previousSibling || el.nodeType === 1) { return el }
  else { return getLastElSibling(el.previousSibling) }
}