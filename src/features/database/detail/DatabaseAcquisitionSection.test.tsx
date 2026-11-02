import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {DatabaseAcquisitionSection} from './DatabaseAcquisitionSection'

describe('DatabaseAcquisitionSection', () => {
  it.each([undefined, '', '   '])('omits an empty section for %s', (source) => {
    const {container} = render(<DatabaseAcquisitionSection source={source} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders source text without interpreting it as HTML', () => {
    render(<DatabaseAcquisitionSection source='  Event reward. <b>Not markup</b>  ' />)
    expect(screen.getByRole('heading', {name: 'How to Obtain'})).toBeInTheDocument()
    expect(screen.getByText('Event reward. <b>Not markup</b>')).toBeInTheDocument()
  })
})
