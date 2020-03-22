const randColor = Math.round(Math.random()*360)
colors = [randColor, (randColor + 100) % 360, (randColor + 200) % 360]

const colorExports = {}
colors.forEach((color, i) => {
    colorExports[`color${ i+1 }`] = {}
    colorExports[`color${ i+1 }`].hue = color + 'deg'
    colorExports[`color${ i+1 }`].brightness = rgbBrightness(hsl2rgb(color/360, .5, .5)).toPrecision(3)
})

module.exports = {
    ...colorExports,
}

function rgbBrightness(rgb) {
    return Math.sqrt(
        rgb.r**2 * .241 +
        rgb.g**2 * .691 +
        rgb.b**2 * .068
    )
}

function hsl2rgb(h, s, l) {
    let r, g, b
    
    if (s === 0) {
        r = g = b = 1 // achromatic
    } else {
        function hue2rgb(p,q,t) {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1/6) return p + (q - p) * 6 * t
            if (t < 1/2) return q
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
        }

        let q = l < .5 ? l * (1 + s)
                       : l + s - l * s
        let p = 2 * l - q

        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
    }

    return { r, g, b }
}