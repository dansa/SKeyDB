import {afterEach, beforeEach} from 'vitest'

import '../builder/builder-page.integration-mocks'

const BUILDER_ALLOW_DUPES_KEY = 'skeydb.builder.allowDupes.v1'
const BUILDER_V2_TEAM_PREVIEW_MODE_KEY = 'skeydb.builderV2.teamPreviewMode.v1'

beforeEach(() => {
  window.localStorage.removeItem(BUILDER_ALLOW_DUPES_KEY)
  window.localStorage.removeItem(BUILDER_V2_TEAM_PREVIEW_MODE_KEY)
})

afterEach(() => {
  window.localStorage.removeItem(BUILDER_ALLOW_DUPES_KEY)
  window.localStorage.removeItem(BUILDER_V2_TEAM_PREVIEW_MODE_KEY)
})
