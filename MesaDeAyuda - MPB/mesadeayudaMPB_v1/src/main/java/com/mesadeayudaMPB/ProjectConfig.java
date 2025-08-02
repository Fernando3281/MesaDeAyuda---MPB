package com.mesadeayudaMPB;

import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.UsuarioService;
import java.util.Date;
import java.util.Locale;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.FixedLocaleResolver;
import org.thymeleaf.extras.java8time.dialect.Java8TimeDialect;

@Configuration
@EnableWebSecurity
public class ProjectConfig implements WebMvcConfigurer {

    @Autowired
    private UsuarioService usuarioService;

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("index");
        registry.addViewController("/index").setViewName("index");
        registry.addViewController("/login").setViewName("login");
        registry.addViewController("/registro/registro").setViewName("/registro/nuevo");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests((request) -> request
                .requestMatchers(
                        "/registro/**",
                        "/js/**",
                        "/css/**",
                        "/img/**",
                        "/webjars/**",
                        "/login"
                ).permitAll()
                // Admin-only routes
                .requestMatchers(
                        "/reportes/listado",
                        "/usuario/crear/**",
                        "/usuario/eliminar/**",
                        "/departamento/**"
                ).hasAuthority("ROL_ADMINISTRADOR")
                // Support and Admin routes (including reports data)
                .requestMatchers(
                        "/usuario/listado",
                        "/usuario/editar/id",
                        "/usuario/actualizar",
                        "/categoria/**",
                        "/reportes/datos",
                        "/tickets/listado",
                        "/tickets/sin-asignar",
                        "/tickets/mis-tickets",
                        "/tickets/manager/**",
                        "/tickets/atender/**",
                        "/tickets/asignar",
                        "/tickets/asignar-prioridad/**",
                        "/tickets/cerrarTicket",
                        "/tickets/reabrir/**",
                        "/tickets/desactivar/**",
                        "/tickets/desactivar-multiples"
                ).hasAnyAuthority("ROL_ADMINISTRADOR", "ROL_SOPORTISTA")
                // User routes (authenticated users)
                .requestMatchers(
                        "/tickets/cancelar",
                        "/tickets/nuevo",
                        "/tickets/guardar",
                        "/tickets/perfil-solicitante/**",
                        "/usuario/perfil",
                        "/usuario/historial",
                        "/usuario/guardar",
                        "/usuario/actualizar-ultima-conexion",
                        "/usuario/detalles/**",
                        "/usuario/configuracion",
                        "/usuario/editar/**",
                        "/mensajes/**"
                ).authenticated()
                // Default route protection
                .anyRequest().authenticated()
                )
                .formLogin((form) -> form
                .loginPage("/login")
                .defaultSuccessUrl("/index", true)
                .successHandler(authenticationSuccessHandler())
                .permitAll()
                )
                .logout((logout) -> logout
                .logoutSuccessUrl("/login?logout")
                .permitAll())
                .rememberMe((remember) -> remember
                .key("AbcdefghiJklmNoPqRsTuVwxyz")
                .tokenValiditySeconds(7 * 24 * 60 * 60));

        return http.build();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthenticatedUserInterceptor())
                .addPathPatterns("/registro/**", "/login");
    }

    // Interceptor interno para redirigir usuarios autenticados
    private static class AuthenticatedUserInterceptor implements HandlerInterceptor {

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            // Verificar si el usuario está autenticado y no es el usuario anónimo
            if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                // Si el usuario está autenticado, redirigir a la página principal
                response.sendRedirect("/");
                return false; // Detener el procesamiento de la solicitud
            }

            return true; // Permitir que la solicitud continúe
        }
    }

    @Autowired
    private UserDetailsService userDetailsService;

    @Bean
    public static BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public LocaleResolver localeResolver() {
        FixedLocaleResolver resolver = new FixedLocaleResolver();
        resolver.setDefaultLocale(new Locale("es", "ES"));
        return resolver;
    }

    @Bean
    public Java8TimeDialect java8TimeDialect() {
        return new Java8TimeDialect();
    }

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
    }

    private AuthenticationSuccessHandler authenticationSuccessHandler() {
        return (request, response, authentication) -> {
            // Actualizar última conexión al autenticarse exitosamente
            String username = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(username);

            if (usuario != null) {
                usuario.setUltimaConexion(new Date());
                usuarioService.save(usuario, false);
            }

            response.sendRedirect("/index");
        };
    }
}
