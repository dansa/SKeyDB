import '@testing-library/jest-dom/vitest'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {AwakenerDetailProfileFacts} from './AwakenerDetailProfileFacts'

describe('AwakenerDetailProfileFacts', () => {
  it.each([false, true])('renders source formatting in profile facts (compact=%s)', (compact) => {
    const {container} = render(
      <AwakenerDetailProfileFacts
        compact={compact}
        profile={{weight: '<Italic:Shh...>', gender: '<Bold:Female>', birthday: '22-Feb'}}
        releaseDate='2026-10-19'
      />,
    )
    expect(screen.getByText('Shh...').tagName).toBe('EM')
    expect(screen.getByText('Female').tagName).toBe('STRONG')
    expect(screen.getByText('22-Feb')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/<(?:Italic|Bold):/)
    expect(container.querySelector('time')).toHaveAttribute('dateTime', '2026-10-19')
    expect(container.querySelector('time')).toHaveTextContent('19 Oct 2026')
  })

  it('places the localized voice actor immediately before the release date', () => {
    const {container} = render(
      <AwakenerDetailProfileFacts
        profile={{voiceActor: 'Example Actor'}}
        releaseDate='2024-08-13'
      />,
    )
    expect(screen.getByText('Example Actor')).toBeInTheDocument()
    expect([...container.querySelectorAll('dt')].map((item) => item.textContent)).toEqual([
      'Voice Actor',
      'Released',
    ])
  })

  it('omits the field when the profile has no voice actor', () => {
    render(<AwakenerDetailProfileFacts profile={{}} releaseDate='2024-08-13' />)
    expect(screen.queryByText('Voice Actor')).not.toBeInTheDocument()
  })
})
