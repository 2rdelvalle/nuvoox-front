/* eslint-disable max-len */
import Link from "next/link"
import { useContext } from "react"
import AppMenu from "./AppMenu"
import { LayoutContext } from "./context/layoutcontext"
import { MenuProvider } from "./context/menucontext"
import { LayoutState } from "../types/layout"
import Image from "next/image"
import LOGO from "../assets/resources/layout_logo_nuvoox_orange.svg"

const AppSidebar = () => {
  const { setLayoutState } = useContext(LayoutContext)
  const anchor = () => {
    setLayoutState((prevLayoutState: LayoutState) => ({
      ...prevLayoutState,
      anchored: !prevLayoutState.anchored
    }))
  }
  return (
        <>
            <div className="sidebar-header">
                <Link href="/" className="app-logo" >
                <Image src={LOGO} alt='imagen de Renting' width={196} height={48}/>
                        {/* <svg
                            width="240"
                            height="41"
                            viewBox="0 0 1600 400"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="app-logo-normal"
                            style={{ width: "196px", height: "48px" }}
                        >
                            <path transform="translate(593,202)" d="m0 0h82l3 3 20 41 14 29 9 17 7 16 10 18h3l10-18 12-24 11-23 15-31 8-21 4-6 4-1h42l-1 10-7 16-8 16-14 29-13 28-10 19-8 16-13 27-8 19-4 6-8 2-11 1h-18l-5-3-5-8-11-22-9-20-16-30-13-29-11-22-11-23-10-17-1 1-1 28-1 54-3 17-6 16-8 17-8 10-7 8-11 9-14 9-13 6-16 4-21 2-16-1-20-5-16-7-11-7-12-11-11-11-9-15-6-14-6-21-1-9 1-6v-14l-4-16-2-9v-9l1-1h40l4 5 4 10 2 19 1 30 4 12 6 9 7 8 11 9 14 7 12 3 12 1 16-5 16-8 6-5 11-15 8-16 1-22 1-81z" fill="#233974"/>
                            <path transform="translate(274,129)" d="m0 0h35l17 3 24 7 18 8 13 8 14 10 13 12 11 12 12 16 8 13 1 7-1 1-9 1h-15l-10-2-13-20-5-6-14-11-17-11-16-8-13-4-22-4-22-1-18 2-21 6-16 8-16 10-16 13-8 8-7 10-12 21-7 19-3 16-2 19v10l4 24 7 21 8 14 11 14 6 7 11 9 15 9 25 12 13 4 10 1 10-7 6-2h17l8 4 7 8 4 10v14l-4 8-8 7-8 4-3 1h-8l-10-3-8-6-5-4-27-8-19-7-11-5-14-8-10-7-10-9-13-13-10-13-9-16-8-19-4-9-5-5-6-4-4-6-4-16v-24l4-17 5-8 7-4h2l2-5 9-21 10-19 11-16 11-13 11-11 17-13 19-11 20-8 14-4z" fill="#E27A64"/>
                            <path transform="translate(1277,196)" d="m0 0h39l1 1 2 25 7 16 6 8 8 7 17 7 19 3 17-1 15-3 17-7 10-9 5-8 4-11 1-5 1-17 1-5 2-1h39l1 1-1 22-3 18-4 11-9 14-9 10-11 10-11 8 2 4 4 5 11 9 9 10 9 14 5 10 6 21 2 16v10l-4 1h-38l-1-1-1-15-6-18-8-14-7-7-13-8-13-5-10-2h-16l-18 6-13 8-6 5-10 16-6 15-1 5-1 14-5 1-36-1-1-1v-10l3-19 7-21 7-12 9-12 9-10 13-12v-3l-10-5-7-7-8-7-10-13-8-16-4-15-1-8v-21z" fill="#C7726A"/>
                            <path transform="translate(936,192)" d="m0 0 17 1 21 4 19 7 16 10 10 8 7 7 9 14 7 15 4 13 2 11v21l-6 24-8 15-8 11-9 10-15 10-16 9-19 6-14 2h-27l-14-2-15-5-16-8-14-10-12-12-9-12-7-15-5-16-1-6v-24l2-11 6-16 8-16 8-11 11-11 10-7 14-6 29-8zm-10 37-13 4-10 6-13 13-8 12-5 12-1 4v20l3 12 6 12 12 13 7 7 10 6 10 4 10 2h12l15-4 14-7 12-11 6-7 6-10 4-13 1-4v-11l-1-13-8-16-7-11-8-8-14-8-9-3-5-1z" fill="#404171"/>
                            <path transform="translate(1157,193)" d="m0 0h26l20 4 18 6 11 6 16 13 9 9 9 14 7 16 4 18 1 9v10l-3 15-5 15-8 16-9 12-8 8-17 12-15 7-19 5-9 1h-31l-17-3-16-6-16-9-9-7-8-7-10-13-8-15-6-22-1-5v-19l6-25 5-12 6-11 9-10 9-8 16-11 16-7 15-4zm4 35-14 3-10 5-13 11-10 13-6 15-2 12v9l3 14 5 13 10 13 11 9 8 5 18 5 7 1h10l15-4 11-6 10-8 8-8 8-14 4-11 1-5v-12l-4-16-5-12-6-10-7-7-14-9-15-5-8-1z" fill="#644E6D"/>
                            <path transform="translate(280,187)" d="m0 0h23l21 5 12 5 15 8 11 11 6 5 7 8 7 11 6 18 5 18 1 9 1 33v22l-1 59-2 2h-16l-23-3-1-1-1-10-1-76-1-32-5-15-9-13-10-9-11-7-5-2-16-2h-13l-12 3-12 6-9 7-8 9-7 14-2 9-1 14v74l-1 9-8-4-10-8-10-14-8-14-8-20-1-5v-24l3-17 5-14 11-23 7-10 14-14 10-7 16-8 13-4z" fill="#233974"/>
                            <path transform="translate(1277,196)" d="m0 0h39l1 1 2 25 7 16 6 8 8 7 17 7 6 4 1 2v7l-5 13 2 1-1 4v12l2 8 2 1 1 8-3 3-12 5-13 9-6 8-7 12-5 13-1 5-1 14-5 1-36-1-1-1v-10l3-19 7-21 7-12 9-12 9-10 13-12v-3l-10-5-7-7-8-7-10-13-8-16-4-15-1-8v-21z" fill="#92606B"/>
                            <path transform="translate(1231,209)" d="m0 0 6 4 11 9 9 9 9 14 7 16 4 18 1 9v10l-3 15-5 15-8 16-9 12-8 8-17 12-15 7-1-2 14-7 1-2-2-2 2-3 1-5h-8l-2-14-13-1-5 3-3-1 11-7 10-9 7-9 5-11 4-13v-12l-4-16-5-12-6-10-10-9-8-5 2-1-6-10-2-4 4-3 10-3 13-1 2-2 6-1z" fill="#7F586C"/>
                            <path transform="translate(870,234)" d="m0 0 5 2 2 3-4 4h-2l2 5-1 9 2-1-1 25 2 5 4 24 7 14 12 13 10 9 4 2-1 4-1 1h-6l1 7-6 1-2 4-5 5h-6l-5-2-9-2h-2l-4-2-11-11-9-12-7-15-5-16-1-6v-24l2-11 6-16 1-1h7l3 1 1-5 6-7 10-6z" fill="#233974"/>
                            <path transform="translate(1405,260)" d="m0 0h8l3 7 4 11 5 9v6l-2 3v6l-1 2h-2v2l-11 9-3 3 2 2-5 2-15-2h-16l-9 2 1-4v-6l-3-1-2-8v-12l1-4-1-5 4-9v-7l-1-2-4-2 4-1 14 2 17-1z" fill="#B96F6D"/>
                            <path transform="translate(1310,315)" d="m0 0h6l7 5 7 2 4 4 4 2 2 5-9 12-7 12-5 13-1 5-1 14-5 1-36-1-1-1v-10l3-19 7-21 7-12 4-5 6-4z" fill="#92606B"/>
                            <path transform="translate(1338,252)" d="m0 0 19 8 6 4 1 2v7l-5 13 2 1-1 4v12l2 8 2 1 1 8-3 3-12 5-10 7-2-1v-4-2l-5-2-4-4-8-2-5-4-9 1-7 2-3 2 2-5 12-13 12-11v-3l-10-5-4-5 10 1 7-8 8-8h2z" fill="#A1676F"/>
                            <path transform="translate(428,205)" d="m0 0h3l8 13 1 7-1 1-9 1h-15l-10-2-8-12v-5l6 4 2 2v3l9 1 2 2 11 1-3-10 3-5z" fill="#C77269"/>
                            <path transform="translate(895,244)" d="m0 0h2l-2 4-7 8-6 11-1 2-6-1v-8l3-4 1 1 6-9z" fill="#2A3B74"/>
                            <path transform="translate(158,261)" d="m0 0 2 2-3 29v14l-3-4v-36l2-4z" fill="#C87269"/>
                            <path transform="translate(1446,378)" d="m0 0 2 1 1 3 4 3 4 2h32v2l-4 1h-38l-1-1z" fill="#E4806B"/>
                            <path transform="translate(163,340)" d="m0 0 3 1 5 12 7 11 3 5h-3l-6-5-6-10-3-10z" fill="#C87269"/>
                            <path transform="translate(874,262)" d="m0 0h3v7h3l-3 11-1 13h-1l-1-7-2-5 1-18z" fill="#454371"/>
                            <path transform="translate(221,175)" d="m0 0 5 1-5 4-10 7-6 1 1-5 3-1 1-3 7-2z" fill="#C87269"/>
                            <path transform="translate(413,224)" d="m0 0h27l-1 2-9 1h-15l-3-2z" fill="#73546D"/>
                            <path transform="translate(1250,350)" d="m0 0 4 1-1 5-6 4h-2v-2h-2l2-6z" fill="#674F6D"/>
                            <path transform="translate(1449,196)" d="m0 0h8v1l-7 2-3 12h-1v-9l1-5z" fill="#E37D68"/>
                            <path transform="translate(898,338)" d="m0 0 5 5h-7l-3-4 5 1z" fill="#474471"/>
                            <path transform="translate(419,229)" d="m0 0h11l1 2h-10z" fill="#8D5E6D"/>
                        </svg> */}
                        <svg
                            width="35"
                            height="35"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="app-logo-small"
                            >
                            <g
                                transform="matrix(1 0 0 1 540 540)"
                                id="ea78a0c7-4b44-4444-8753-884c007ee563"
                            >
                                <rect
                                style={{
                                  stroke: "none",
                                  strokeWidth: 1,
                                  strokeDasharray: "none",
                                  strokeLinecap: "butt",
                                  strokeDashoffset: 0,
                                  strokeLinejoin: "miter",
                                  strokeMiterlimit: 4,
                                  fill: "rgb(255,255,255)",
                                  fillRule: "nonzero",
                                  opacity: 1,
                                  visibility: "hidden"
                                }}
                                vectorEffect="non-scaling-stroke"
                                x="-540"
                                y="-540"
                                rx="0"
                                ry="0"
                                width="1080"
                                height="1080"
                                />
                            </g>
                            <g
                                transform="matrix(1 0 0 1 540 540)"
                                id="4378118d-6000-4409-8846-4c0faf98dd84"
                            ></g>
                            <g transform="matrix(0.31 0 0 0.31 605.89 540)">
                                <path
                                style={{
                                  stroke: "none",
                                  strokeWidth: 1,
                                  strokeDasharray: "none",
                                  strokeLinecap: "butt",
                                  strokeDashoffset: 0,
                                  strokeLinejoin: "miter",
                                  strokeMiterlimit: 4,
                                  fill: "rgb(226,122,100)",
                                  fillRule: "nonzero",
                                  opacity: 1
                                }}
                                vectorEffect="non-scaling-stroke"
                                transform="translate(-1.5, -167.5)"
                                d="M 0 0 L 35 0 L 52 3 L 76 10 L 94 18 L 107 26 L 121 36 L 134 48 L 145 60 L 157 76 L 165 89 L 166 96 L 165 97 L 156 98 L 141 98 L 131 96 L 118 76 L 113 70 L 99 59 L 82 48 L 66 40 L 53 36 L 31 32 L 9 31 L -9 33 L -30 39 L -46 47 L -62 57 L -78 70 L -86 78 L -93 88 L -105 109 L -112 128 L -115 144 L -117 163 L -117 173 L -113 197 L -106 218 L -98 232 L -87 246 L -81 253 L -70 262 L -55 271 L -30 283 L -17 287 L -7 288 L 3 281 L 9 279 L 26 279 L 34 283 L 41 291 L 45 301 L 45 315 L 41 323 L 33 330 L 25 334 L 22 335 L 14 335 L 4 332 L -4 326 L -9 322 L -36 314 L -55 307 L -66 302 L -80 294 L -90 287 L -100 278 L -113 265 L -123 252 L -132 236 L -140 217 L -144 208 L -149 203 L -155 199 L -159 193 L -163 177 L -163 153 L -159 136 L -154 128 L -147 124 L -145 124 L -143 119 L -134 98 L -124 79 L -113 63 L -102 50 L -91 39 L -74 26 L -55 15 L -35 7 L -21 3 z"
                                />
                            </g>
                            {/* Resto del contenido */}
                            </svg>

                </Link>
                <button
                    className="layout-sidebar-anchor p-link z-2 mb-2"
                    type="button"
                    onClick={anchor}
                ></button>
            </div>

            <div className="layout-menu-container">
                <MenuProvider>
                    <AppMenu />
                </MenuProvider>
            </div>
        </>
  )
}

export default AppSidebar
