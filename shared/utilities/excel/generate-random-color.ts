// GENERA UN COLOR RANDOM Y LO DEVUELVE COMO STRING
export function generateRandomColor () {
  const color = Math.floor(Math.random() * 16777215).toString(16)
  return "#" + color
}

// RECIBE UNA CANTIDAD EN NUMEROS Y DEVUELVE UN ARRAY DE STRING CON LOS COLORES GENERADOS
export function generateArrayRandomColors (quantity: number) {
  const colors: string[] = []
  for (let index = 0; index < quantity; index++) {
    colors.push(generateRandomColor())
  }
  return colors
}
