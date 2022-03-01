// from https://github.com/RangerMauve/gemini-to-html
// AGPL license

// const { htmlEscape } = require('escape-goat')
// const slug = require('slug')
//
// module.exports = render

function id(content) {
  return slug(content, {
    replacement: '_'
  })
}

function render (tokens) {
  return tokens.map((line) => {
    const { type } = line

    switch (type) {
      // case 'quote': return htmlEscape`<blockquote>${line.content}</blockquote>`
      case 'quote': return `<blockquote>\n${line.items.map((item) => item ?
				      htmlEscape`\t<p>${item}</p>` : '<br>'
			      ).join('\n')}\n</blockquote>`
      case 'header': return htmlEscape`<h${line.level} id="${id(line.content)}">${line.content}</h${line.level}>`
      case 'link': return htmlEscape`<p><a href="${line.href}" class="${line.className}">${line.content}</a></p>`
      case 'prompt': return htmlEscape`<p class="input"><input data-url="${line.href}" placeholder="${line.content}" onkeypress="if(event.keyCode==13)submitPrompt(this)"> <button onclick="submitPrompt(this.parentNode.querySelector('input'))">submit</button></p>`
      case 'pre': return line.alt
        ? htmlEscape`<pre><code class="language-${line.alt}">\n${line.items.join('\n')}\n</code></pre>`
        : htmlEscape`<pre>\n${line.items.join('\n')}\n</pre>`
      case 'list': return `<ul>\n${line.items.map((item) => htmlEscape`\t<li>${item}</li>`).join('\n')}\n</ul>`
      case 'hr': return '<hr>'
      default: return line.content ? htmlEscape`<p>${line.content}</p>` : '<br>' // '<p></p>' // '<br/>'
    }
  }).join('\n')
}
