# Usar imagen base de Java con JDK 20 (coincide con tu pom.xml)
FROM eclipse-temurin:20-jdk-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar Maven y fuentes necesarias para JasperReports
RUN apk add --no-cache maven fontconfig ttf-dejavu

# Instalar fuentes adicionales para mejor compatibilidad con JasperReports
RUN apk add --no-cache \
    ttf-liberation \
    ttf-linux-libertine \
    && fc-cache -fv

# Copiar archivos de configuración de Maven primero (para cache de layers)
COPY ["MesaDeAyuda - MPB/mesadeayudaMPB_v1/pom.xml", "."]

# Descargar dependencias (se cachea si pom.xml no cambia)
RUN mvn dependency:go-offline -B

# Copiar todo el código fuente
COPY ["MesaDeAyuda - MPB/mesadeayudaMPB_v1/src", "./src"]

# Compilar la aplicación
RUN mvn clean package -DskipTests

# Mover el JAR compilado a la raíz del directorio de trabajo
RUN mv target/*.jar app.jar

# Verificar que los recursos estáticos estén en el JAR
RUN jar tf app.jar | grep -E "\.(css|js|html)$" | head -10

# Crear un usuario no privilegiado para mayor seguridad
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001

# Cambiar la propiedad del directorio de trabajo al usuario spring
RUN chown -R spring:spring /app
USER spring

# Exponer el puerto que usa Spring Boot
EXPOSE 8080

# Variables de entorno para producción
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

# Variables de entorno específicas para JasperReports
ENV JAVA_FONTS=/usr/share/fonts
ENV NET_SF_JASPERREPORTS_AWT_IGNORE_MISSING_FONT=true
ENV NET_SF_JASPERREPORTS_DEFAULT_FONT_NAME=SansSerif

# Configurar JVM para contenedores con configuración específica para JasperReports
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseContainerSupport -XX:MaxRAMPercentage=80.0 -Djava.awt.headless=true -Dnet.sf.jasperreports.awt.ignore.missing.font=true -Dnet.sf.jasperreports.default.font.name=SansSerif"

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]