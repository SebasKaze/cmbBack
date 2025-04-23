# Usa una imagen oficial de Node.js
FROM node:18

# Crea y usa el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de tu proyecto
COPY . .

# Instala las dependencias
RUN npm install

# Expone el puerto que usa tu app
EXPOSE 4000

# Comando para iniciar tu app
CMD ["node", "index.js"]
