const randColor = Math.round(Math.random()*360)

module.exports = {
    themeColor1: `hsl(${ randColor }deg, 60%, 85%)`,
    themeColor1Dark: `hsl(${ randColor }deg, 80%, 15%)`,
    themeColor2: `hsl(${ randColor + 110 }deg, 60%, 85%)`,
    themeColor2Dark: `hsl(${ randColor + 110 }deg, 80%, 15%)`,
}