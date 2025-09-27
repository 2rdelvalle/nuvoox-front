"use client";
import type { Breadcrumb, BreadcrumbItem, MenuModel, MenuProps } from "@/types"
import { Tooltip } from "primereact/tooltip"
import { useContext, useEffect, useRef, useState } from "react"
import AppMenuitem from "./AppMenuitem"
import { LayoutContext } from "./context/layoutcontext"
import { MenuProvider } from "./context/menucontext"

const AppSubMenu = (props: MenuProps) => {
  const { layoutState, setBreadcrumbs } = useContext(LayoutContext)
  const tooltipRef = useRef<Tooltip | null>(null)
  // Estado para controlar si estamos en el cliente
  const [mounted, setMounted] = useState(false)
  
  // Efecto para marcar el componente como montado en el cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return;
    
    if (tooltipRef.current) {
      tooltipRef.current.hide();
      (tooltipRef.current as any).updateTargetEvents()
    }
  }, [layoutState.overlaySubmenuActive, mounted])

  useEffect(() => {
    if (!mounted) return;
    generateBreadcrumbs(props.model)
  }, [mounted, props.model])

  const generateBreadcrumbs = (model: MenuModel[]) => {
    const breadcrumbs: Breadcrumb[] = []

    const getBreadcrumb = (item: BreadcrumbItem, labels: string[] = []) => {
      const { label, to, items } = item

      label && labels.push(label)
      items &&
                items.forEach((_item) => {
                  getBreadcrumb(_item, labels.slice())
                })
      to && breadcrumbs.push({ labels, to })
    }

    model.forEach((item) => {
      getBreadcrumb(item)
    })
    setBreadcrumbs(breadcrumbs)
  }

  // Durante el renderizado del servidor o mientras no estemos en el cliente,
  // devolver un div vacío para evitar discrepancias de hidratación
  if (!mounted) {
    return (
      <MenuProvider>
        <ul className="layout-menu"></ul>
      </MenuProvider>
    );
  }
  
  return (
    <MenuProvider>
      <ul className="layout-menu">
        {props.model && props.model.map((item, i) => {
          if (!item) return null;
          return !item.seperator
            ? (
                <AppMenuitem
                    item={item}
                    root={true}
                    index={i}
                    key={item.label || `item-${i}`}
                />
              )
            : (
                <li className="menu-separator" key={`separator-${i}`}></li>
              )
        })}
      </ul>
      <Tooltip
                ref={tooltipRef}
                target="li:not(.active-menuitem)>.tooltip-target"
            />
    </MenuProvider>
  )
}

export default AppSubMenu
