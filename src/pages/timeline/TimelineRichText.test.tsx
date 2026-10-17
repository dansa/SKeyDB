import {render, screen} from '@testing-library/react'

import {TimelineRichText} from './TimelineRichText'

describe('TimelineRichText', () => {
  it('renders the shared timeline copy subset safely', () => {
    const {container} = render(
      <p>
        <TimelineRichText
          text={'Plain *italic* **bold**\n[Link](https://example.com) <em>raw</em>'}
        />
      </p>,
    )

    expect(container.querySelector('em')).toHaveTextContent('italic')
    expect(container.querySelector('strong')).toHaveTextContent('bold')
    expect(container.querySelector('br')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: /Link.*opens in new tab/})).toHaveAttribute(
      'href',
      'https://example.com',
    )
    expect(screen.getByText(/<em>raw<\/em>/)).toBeInTheDocument()
  })

  it('can render embedded Silver Prime prices as estimated dollars', () => {
    render(
      <p>
        <TimelineRichText
          priceMode='usd-estimate'
          text='Each gift box costs 1980 Silver Prime. Tiers: 680-1280 Silver Prime.'
        />
      </p>,
    )

    expect(screen.getByText('Each gift box costs ~$29. Tiers: ~$11-19.')).toBeInTheDocument()
  })
})
