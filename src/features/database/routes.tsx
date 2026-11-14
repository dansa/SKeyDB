import {Route} from 'react-router'

import {DatabasePage, LegacyAwakenerRouteRedirect} from './DatabaseRouteComponents'

export const DatabaseRouteElements = (
  <>
    <Route element={<LegacyAwakenerRouteRedirect />} path='/database/awk/:awakenerSlug' />
    <Route element={<LegacyAwakenerRouteRedirect />} path='/database/awk/:awakenerSlug/:tabSlug' />
    <Route element={<DatabasePage />} path='/database/*' />
  </>
)
