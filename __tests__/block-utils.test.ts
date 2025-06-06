import { markdownToBlocks, blocksToMarkdown } from '../app/lib/block-utils'

describe('block-utils', () => {
  it('converts markdown heading to block', () => {
    const blocks = markdownToBlocks('# Hello')
    expect(blocks[0].type).toBe('heading_1')
    expect(blocks[0].content[0].text.content).toBe('Hello')
  })

  it('converts blocks back to markdown', () => {
    const blocks = markdownToBlocks('## Hi\n\nParagraph')
    const md = blocksToMarkdown(blocks)
    expect(md).toContain('## Hi')
    expect(md).toContain('Paragraph')
  })
})
