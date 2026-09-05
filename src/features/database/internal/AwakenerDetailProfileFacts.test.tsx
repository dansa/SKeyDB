import '@testing-library/jest-dom/vitest'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {AwakenerDetailProfileFacts} from './AwakenerDetailProfileFacts'

describe('AwakenerDetailProfileFacts', () => {
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
