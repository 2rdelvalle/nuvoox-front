import { EmptyPageProps } from "./types/emptyPageProps"
import { ScrollTop } from "primereact/scrolltop"

const EmptyPage = ({ children, threshold = 50, target = "window" }: EmptyPageProps) => {
  return (
        <div className="grid w-full">
            <ScrollTop target="window" threshold={50}/>
            <div className="col-12">
                <div className="card">
                    {children}
                </div>
            </div>
        </div>
  )
}

export default EmptyPage
