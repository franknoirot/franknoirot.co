const bookGrid = document.querySelector('.book-grid')
const bookList = Array.from(document.querySelectorAll('.book'))
console.log('bookGrid = ', bookGrid)
console.log('bookList = ', bookList)

// button definitions
const alphaSort = { el: document.querySelector('.sort-controls .alphabetical'), val: false }


// alpha sort
alphaSort.el.addEventListener('click', function() {
    const newBookList = bookList.sort((a,b) => alphaSort.val 
        ? (a.dataset.title - b.dataset.title)
        : (b.dataset.title - a.dataset.title))

    console.log('bookList = ', bookList.map(book => book.dataset.title))
    console.log('newBookList = ', newBookList.map(book => book.dataset.title))

    for (book of newBookList) {
        bookGrid.removeChild(bookGrid.children[0])
        bookGrid.appendChild(book)
    }
    bookGrid.classList.toggle('alphabetical')
    
    alphaSort.val = !alphaSort.val
    alphaSort.el.innerText = alphaSort.val ? 'Z-A' : 'A-Z'
})
