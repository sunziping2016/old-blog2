import { InjectionKey } from 'vue'
import { createStore, Store } from 'vuex'
import { SiteData } from '../../shared/config'
import siteData from '@siteData'

export interface State {
  siteData: SiteData
}

export const storeKey: InjectionKey<Store<State>> = Symbol()

export const store = createStore<State>({
  state: {
    siteData: siteData as SiteData
  }
})
