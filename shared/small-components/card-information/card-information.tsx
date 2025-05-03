import React from "react"

type CardInformationProps = {
    title: string;
    data: string;
    type?: string;
    subdata?: string;
}

const CardInformation = ({ title, data, subdata, type } : CardInformationProps) => {
  function createRandomPathD (): string {
    const width = 115 // Ancho del SVG
    const height = 41 // Alto del SVG
    const amplitude = 15 // Amplitud de las ondas
    const frequency = 0.1 // Frecuencia de las ondas

    // Crea un array para almacenar los puntos del path
    const path = []

    // Itera a través de los puntos a lo largo del ancho del SVG
    for (let x = 0; x <= width; x++) {
      // Calcula la posición y usando una función seno para crear una onda
      const y = height / 2 + amplitude * Math.sin(frequency * x)

      // Agrega el punto al path
      if (x === 0) {
        path.push(`M${x} ${y}`)
      } else {
        path.push(`L${x} ${y}`)
      }
    }

    // Asegúrate de cerrar el path si es necesario
    path.push(`L${width} ${height}`)
    path.push(`L0 ${height}`)
    path.push("Z") // Cierra el path

    // Convierte el array de comandos en una cadena
    return path.join(" ")
  }

  return (
        <div className="card h-full">
            <span className="font-semibold text-lg">{title}</span>
            <div className="flex justify-content-between align-items-start mt-3">
                <div className="w-6">
                    <span className="text-4xl font-bold text-900">
                        {data}
                    </span>
                    {
                    subdata &&
                    (
                        <div className="text-green-500">
                            <span className="font-medium">{subdata}</span>
                            <i className="pi pi-arrow-up text-xs ml-2"></i>
                        </div>
                    )
                    }
                </div>
                <div className="w-6">
                    <svg
                        width="100%"
                        viewBox="0 0 115 41"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        >
                        <path
                            d={createRandomPathD()}
                            style={{
                              strokeWidth: "1px",
                              stroke: "var(--primary-color)"
                            }}
                        />
                    </svg>
                </div>
            </div>
        </div>
  )
}

export default CardInformation
