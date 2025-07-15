# Usar imagen base de Java con JDK 20 (coincide con tu pom.xml)
FROM eclipse-temurin:20-jdk-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar Maven para construir la aplicación
RUN apk add --no-cache maven

# Copiar archivos de configuración de Maven
COPY "MesaDeAyuda - MPB/mesadeayudaMPB_v1/pom.xml" .
COPY "MesaDeAyuda - MPB/mesadeayudaMPB_v1/src" ./src

# Compilar la aplicación
RUN mvn clean package -DskipTests

# Mover el JAR compilado a la raíz del directorio de trabajo
RUN mv target/*.jar app.jar

# Crear un usuario no privilegiado para mayor seguridad
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001

# Cambiar la propiedad del directorio de trabajo al usuario spring
RUN chown -R spring:spring /app
USER spring

# Exponer el puerto que usa Spring Boot (cambiado a 8080 para Render)
EXPOSE 8080

# Variables de entorno para producción
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

# Configurar JVM para contenedores
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseContainerSupport -XX:MaxRAMPercentage=80.0"

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]