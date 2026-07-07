export function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/## (.*?)(<br\/>|<\/p>)/g, "<h2>$1</h2>")
    .replace(/# (.*?)(<br\/>|<\/p>)/g, "<h2>$1</h2>");
}
