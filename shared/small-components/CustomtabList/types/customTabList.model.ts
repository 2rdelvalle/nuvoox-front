import React from "react"

export interface tabsPanels{
    header: string;
    disabled?: boolean;
    icon?: string;
    classname?: string;
    children: React.ReactNode;
}

export interface PropsCustomTabList {
   tabs: tabsPanels[];
}
