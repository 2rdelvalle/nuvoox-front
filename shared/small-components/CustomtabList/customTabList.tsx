import { TabView, TabPanel } from "primereact/tabview"
import { PropsCustomTabList } from "./types/customTabList.model"

function CustomTabList (props : PropsCustomTabList) {
  const { tabs } = props
  return (
    <TabView scrollable>
        {
            tabs.map((tab) => {
              const { children, header, disabled, icon, classname } = tab
              const iconTab: string = `${icon} mr-2`
              return (
                <TabPanel className={classname} header={header} key={header} disabled={disabled} leftIcon={iconTab}>
                    {children}
                </TabPanel>
              )
            })
        }
    </TabView>
  )
}

export default CustomTabList
