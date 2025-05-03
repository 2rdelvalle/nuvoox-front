# Etapa de construcción
FROM node:current-alpine3.19 AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de configuración de dependencias
COPY package.json package-lock.json ./


# Instalar las dependencias con pnpm
RUN npm install --force

# Copiar el resto de los archivos del proyecto
COPY . ./

# Construir la aplicación Next.js
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Iniciar la aplicación en modo producción
CMD ["npm", "start"]
