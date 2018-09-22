module.exports = new (class BBCode{

  user(userName) {
    return `[user]${userName}[/user]`;
  }
  
  icon(userName) {
    return `[icon]${userName}[/icon]`;
  }
  
  bold(text) {
    return `[b]${text}[/b]`;
  }

  italic(text) {
    return `[i]${text}[/i]`;
  }

  underline(text) {
    return `[u]${text}[/u]`;
  }

  strike(text) {
    return `[s]${text}[/s]`;
  }

  sup(text) {
    return `[sup]${text}[/sup]`;
  }

  sub(text) {
    return `[sub]${text}[/sub]`;
  }

  color(shade, text) {
    return `[color=${shade}]${text}[/color]`;
  }

  white(text) {
    return `[color=white]${text}[/color]`;
  }

  black(text) {
    return `[color=black]${text}[/color]`;
  }

  red(text) {
    return `[color=red]${text}[/color]`;
  }

  blue(text) {
    return `[color=blue]${text}[/color]`;
  }

  yellow(text) {
    return `[color=yellow]${text}[/color]`;
  }

  green(text) {
    return `[color=green]${text}[/color]`;
  }

  pink(text) {
    return `[color=pink]${text}[/color]`;
  }

  gray(text) {
    return `[color=gray]${text}[/color]`;
  }

  orange(text) {
    return `[color=orange]${text}[/color]`;
  }

  purple(text) {
    return `[color=purple]${text}[/color]`;
  }

  brown(text) {
    return `[color=brown]${text}[/color]`;
  }

  cyan(text) {
    return `[color=cyan]${text}[/color]`;
  }

  url(link, text) {
    return `[url=${link}]${text}[/url]`;
  }

  eicon (emoji) {
    return `[eicon]${emoji}[/eicon]`;
  }

  noParse(code) {
    return `[noparse]${code}[/noparse]`;
  }
})();