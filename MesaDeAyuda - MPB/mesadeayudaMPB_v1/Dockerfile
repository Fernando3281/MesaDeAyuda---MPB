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

# Copiar archivos de configuración de Maven primero (para mejor cache de Docker)
COPY ["MesaDeAyuda - MPB/mesadeayudaMPB_v1/pom.xml", "."]

# Descargar dependencias de Maven (esto se cachea si pom.xml no cambia)
RUN mvn dependency:go-offline -B

# Copiar todo el código fuente incluyendo recursos estáticos
COPY ["MesaDeAyuda - MPB/mesadeayudaMPB_v1/src", "./src"]

# Verificar que los archivos estáticos se copiaron correctamente
RUN echo "=== Verificando estructura de archivos ===" && \
    find src/main/resources -type f -name "*.css" -o -name "*.js" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" | head -20 && \
    echo "=== Verificando templates ===" && \
    find src/main/resources/templates -type f -name "*.html" | head -10 && \
    echo "=== Verificando reportes ===" && \
    find src/main/resources/reports -type f | head -10

# Compilar la aplicación con perfil de producción
RUN mvn clean package -DskipTests -Pprod || mvn clean package -DskipTests

# Verificar que el JAR se compiló correctamente
RUN echo "=== Verificando JAR compilado ===" && \
    ls -la target/ && \
    echo "=== Verificando contenido del JAR ===" && \
    jar -tf target/*.jar | grep -E "\.(css|js|png|jpg|jpeg|gif|html)$" | head -20

# Mover el JAR compilado a la raíz del directorio de trabajo
RUN mv target/*.jar app.jar

# Verificar el contenido final del JAR
RUN echo "=== Contenido final del JAR app.jar ===" && \
    jar -tf app.jar | grep -E "static/.*\.(css|js|png|jpg|jpeg|gif)$" | head -10 && \
    echo "=== Templates en el JAR ===" && \
    jar -tf app.jar | grep -E "templates/.*\.html$" | head -10

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

# Variables de entorno específicas para JasperReports
ENV JAVA_FONTS=/usr/share/fonts
ENV NET_SF_JASPERREPORTS_AWT_IGNORE_MISSING_FONT=true
ENV NET_SF_JASPERREPORTS_DEFAULT_FONT_NAME=SansSerif

# Configurar JVM para contenedores con configuración específica para JasperReports
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseContainerSupport -XX:MaxRAMPercentage=80.0 -Djava.awt.headless=true -Dnet.sf.jasperreports.awt.ignore.missing.font=true -Dnet.sf.jasperreports.default.font.name=SansSerif"

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]